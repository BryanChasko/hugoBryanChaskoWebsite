#!/usr/bin/env perl
use v5.26;
use strict;
use warnings;
use IPC::Open3;
use Symbol qw(gensym);
use Getopt::Long qw(GetOptions);
use File::Spec;

# ----------------------------
# Pretty output helpers
# ----------------------------
package Out;
sub _ansi { my($c)=@_; return $ENV{NO_COLOR} ? '' : $c }
sub green { _ansi("\e[32m").(join '', @_). _ansi("\e[0m") }
sub yellow{ _ansi("\e[33m").(join '', @_). _ansi("\e[0m") }
sub red   { _ansi("\e[31m").(join '', @_). _ansi("\e[0m") }
sub blue  { _ansi("\e[34m").(join '', @_). _ansi("\e[0m") }
sub info  { say blue('ℹ '),  @_ }
sub ok    { say green('✓ '), @_ }
sub warn  { say yellow('! '), @_ }
sub err   { say red('✗ '),   @_ }

# ----------------------------
# Utilities
# ----------------------------
package Util;
sub run {
  my ($argv, %opts) = @_;
  my $cmd_str = join(' ', map { /\s/ ? qq{"$_"} : $_ } @$argv);
  Out::info("run: $cmd_str") if $opts{verbose};

  if ($opts{dry_run}) { return (0, "(dry-run) $cmd_str\n", '') }

  my ($wtr, $rdr, $err) = (undef, undef, Symbol::gensym());
  my $pid = IPC::Open3::open3($wtr, $rdr, $err, @$argv);
  close $wtr if $wtr;

  my $out = do { local $/; <$rdr> // '' };
  my $errout = do { local $/; <$err> // '' };
  waitpid($pid, 0);
  my $code = $? >> 8;

  print $out if $opts{verbose} && length $out;
  print $errout if ($opts{verbose} || $code != 0) && length $errout;

  return ($code, $out, $errout);
}

package AWS;
sub new {
  my ($class, %args) = @_;
  my $self = { profile=>$args{profile}, region=>$args{region}, verbose=>$args{verbose}//0, dry_run=>$args{dry_run}//0 };
  bless $self, $class; return $self;
}

sub _base_args {
  my ($self)=@_;
  my @args = ('aws');
  push @args, ('--profile', $self->{profile}) if $self->{profile};
  push @args, ('--region',  $self->{region})  if $self->{region};
  return @args;
}

sub run_cmd {
  my ($self, @cmd) = @_;
  return Util::run([@cmd], verbose=>$self->{verbose}, dry_run=>$self->{dry_run});
}

sub bucket_exists {
  my ($self, $bucket) = @_;
  return 1 if $self->{dry_run};
  my @cmd = ($self->_base_args, 's3api', 'head-bucket', '--bucket', $bucket);
  my ($code, $out, $err) = Util::run(\@cmd, verbose=>0);
  return $code == 0;
}

sub create_bucket {
  my ($self, $bucket, $region) = @_;
  my @cmd = ($self->_base_args, 's3api', 'create-bucket', '--bucket', $bucket);
  unless ($region eq 'us-east-1') {
    push @cmd, ('--create-bucket-configuration', "LocationConstraint=$region");
  }
  return Util::run(\@cmd, verbose=>1, dry_run=>$self->{dry_run});
}

sub put_public_access_block {
  my ($self, $bucket) = @_;
  my @cmd = ($self->_base_args, 's3api', 'put-public-access-block', '--bucket', $bucket,
    '--public-access-block-configuration',
    'BlockPublicAcls=true,IgnorePublicAcls=true,BlockPublicPolicy=true,RestrictPublicBuckets=true');
  return Util::run(\@cmd, verbose=>0, dry_run=>$self->{dry_run});
}

sub enable_versioning {
  my ($self, $bucket) = @_;
  my @cmd = ($self->_base_args, 's3api', 'put-bucket-versioning', '--bucket', $bucket,
    '--versioning-configuration', 'Status=Enabled');
  return Util::run(\@cmd, verbose=>0, dry_run=>$self->{dry_run});
}

sub enable_encryption {
  my ($self, $bucket) = @_;
  my $config = '{"Rules":[{"ApplyServerSideEncryptionByDefault":{"SSEAlgorithm":"AES256"}}]}';
  my @cmd = ($self->_base_args, 's3api', 'put-bucket-encryption', '--bucket', $bucket,
    '--server-side-encryption-configuration', $config);
  return Util::run(\@cmd, verbose=>0, dry_run=>$self->{dry_run});
}

sub put_bucket_tagging {
  my ($self, $bucket) = @_;
  my $tags = 'TagSet=[{Key=Project,Value=bryanchasko-com},{Key=Purpose,Value=Terraform-State},{Key=Environment,Value=Production}]';
  my @cmd = ($self->_base_args, 's3api', 'put-bucket-tagging', '--bucket', $bucket, '--tagging', $tags);
  return Util::run(\@cmd, verbose=>0, dry_run=>$self->{dry_run});
}

sub dynamodb_table_exists {
  my ($self, $table) = @_;
  return 1 if $self->{dry_run};
  my @cmd = ($self->_base_args, 'dynamodb', 'describe-table', '--table-name', $table);
  my ($code, $out, $err) = Util::run(\@cmd, verbose=>0);
  return $code == 0;
}

sub create_dynamodb_table {
  my ($self, $table) = @_;
  my @cmd = ($self->_base_args, 'dynamodb', 'create-table',
    '--table-name', $table,
    '--attribute-definitions', 'AttributeName=LockID,AttributeType=S',
    '--key-schema', 'AttributeName=LockID,KeyType=HASH',
    '--billing-mode', 'PAY_PER_REQUEST');
  return Util::run(\@cmd, verbose=>1, dry_run=>$self->{dry_run});
}

# ----------------------------
# Main
# ----------------------------
package main;

sub main {
  my %opts = (
    bucket => 'bryanchasko-terraform-state',
    table  => 'bryanchasko-terraform-lock',
    region => 'us-west-2',
    profile => 'aerospaceug-admin',
    verbose => 0,
    dry_run => 0,
  );

  GetOptions(
    'bucket=s' => \$opts{bucket},
    'table=s'  => \$opts{table},
    'region=s' => \$opts{region},
    'profile=s' => \$opts{profile},
    'dry-run'  => \$opts{dry_run},
    'verbose'  => \$opts{verbose},
    'help'     => \$opts{help},
  ) or die "Invalid options. Use --help.\n";

  if ($opts{help}) {
    print <<'USAGE';
Usage:
  perl scripts/setup-terraform-backend.pl [--bucket NAME] [--table NAME] [--region REGION]
                                         [--profile PROFILE] [--dry-run] [--verbose]

Options:
  --bucket    Terraform state bucket (default: bryanchasko-terraform-state)
  --table     DynamoDB lock table name (default: bryanchasko-terraform-lock)
  --region    AWS region (default: us-west-2)
  --profile   AWS CLI profile (default: aerospaceug-admin)
  --dry-run   Show commands without executing them
  --verbose   Print AWS CLI commands as they run

Purpose:
  Creates the S3 bucket and DynamoDB table used by Terraform's S3 backend with locking.

Examples:
  perl scripts/setup-terraform-backend.pl
  perl scripts/setup-terraform-backend.pl --dry-run --verbose
  perl scripts/setup-terraform-backend.pl --bucket my-state-bucket --table my-lock-table
USAGE
    exit 0;
  }

  Out::info("Terraform Backend Setup");
  say "  Bucket: $opts{bucket}";
  say "  Table:  $opts{table}";
  say "  Region: $opts{region}";
  say "  Profile: $opts{profile}";
  say "";

  eval {
    my $aws = AWS->new(
      profile => $opts{profile},
      region  => $opts{region},
      verbose => $opts{verbose},
      dry_run => $opts{dry_run},
    );

    if ($aws->bucket_exists($opts{bucket})) {
      Out::ok("Bucket $opts{bucket} already exists - applying configuration");
    } else {
      Out::info("Creating Terraform state bucket...");
      my ($code, $out, $err) = $aws->create_bucket($opts{bucket}, $opts{region});
      die Out::err("Failed to create bucket: $err") if $code != 0;
      Out::ok("State bucket created");
    }

    say "";
    Out::info("Configuring bucket security");
    Out::info("  Enabling versioning");
    my ($vcode, $vout, $verr) = $aws->enable_versioning($opts{bucket});
    die Out::err("Failed to enable versioning: $verr") if $vcode != 0;

    Out::info("  Blocking public access");
    my ($pcode, $pout, $perr) = $aws->put_public_access_block($opts{bucket});
    die Out::err("Failed to block public access: $perr") if $pcode != 0;

    Out::info("  Enabling AES256 encryption");
    my ($ecode, $eout, $eerr) = $aws->enable_encryption($opts{bucket});
    die Out::err("Failed to enable encryption: $eerr") if $ecode != 0;

    Out::info("  Adding helpful tags");
    my ($tcode, $tout, $terr) = $aws->put_bucket_tagging($opts{bucket});
    die Out::err("Failed to tag bucket: $terr") if $tcode != 0;

    say "";
    if ($aws->dynamodb_table_exists($opts{table})) {
      Out::ok("DynamoDB table $opts{table} already exists");
    } else {
      Out::info("Creating DynamoDB lock table...");
      my ($dcode, $dout, $derr) = $aws->create_dynamodb_table($opts{table});
      die Out::err("Failed to create DynamoDB table: $derr") if $dcode != 0;
      Out::ok("Lock table created");
    }

    say "";
    Out::info("Backend summary");
    say "  Terraform state bucket: $opts{bucket}";
    say "  DynamoDB lock table: $opts{table}";
    say "";
    Out::info("Next steps:");
    say "  1) Run 'terraform init' inside the terraform/ directory";
    say "  2) Add the output 'github_oidc_role_arn' as the AWS_OIDC_ROLE_ARN GitHub secret";
    say "  3) Update workflows to request an OIDC token scoped to that role";
  };
  if ($@) {
    Out::err($@);
    exit 1;
  }

  exit 0;
}

exit(main());
