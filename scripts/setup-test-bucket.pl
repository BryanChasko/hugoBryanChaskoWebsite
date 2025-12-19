#!/usr/bin/env perl
use v5.26;
use strict;
use warnings;
use JSON::PP qw(decode_json);
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

1;

# ----------------------------
# AWS CLI wrapper
# ----------------------------
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

sub aws_json {
  my ($self, @rest) = @_;
  return (0, {}, '') if $self->{dry_run};
  my @cmd = ($self->_base_args, @rest, '--output', 'json');
  my ($code, $out, $err) = Util::run(\@cmd, verbose=>$self->{verbose}, dry_run=>$self->{dry_run});
  my $data = {};
  if ($code == 0 && $out) {
    eval { $data = decode_json($out) };
  }
  return ($code, $data, $err);
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

sub put_lifecycle_configuration {
  my ($self, $bucket) = @_;
  my $config = '{
    "Rules": [
      {
        "ID": "ExpireOldBaselines",
        "Status": "Enabled",
        "Filter": {"Prefix": "baselines/"},
        "NoncurrentVersionExpiration": {"NoncurrentDays": 180},
        "NoncurrentVersionTransitions": [
          {
            "NoncurrentDays": 90,
            "StorageClass": "GLACIER"
          }
        ]
      },
      {
        "ID": "DeleteOldDeleteMarkers",
        "Status": "Enabled",
        "Filter": {"Prefix": "baselines/"},
        "Expiration": {"ExpiredObjectDeleteMarker": true}
      }
    ]
  }';
  my @cmd = ($self->_base_args, 's3api', 'put-bucket-lifecycle-configuration', '--bucket', $bucket,
    '--lifecycle-configuration', $config);
  return Util::run(\@cmd, verbose=>0, dry_run=>$self->{dry_run});
}

sub put_bucket_tagging {
  my ($self, $bucket) = @_;
  my $tags = 'TagSet=[{Key=Project,Value=bryanchasko-com},{Key=Purpose,Value=WebGL-Test-Baselines},{Key=Environment,Value=Testing}]';
  my @cmd = ($self->_base_args, 's3api', 'put-bucket-tagging', '--bucket', $bucket,
    '--tagging', $tags);
  return Util::run(\@cmd, verbose=>0, dry_run=>$self->{dry_run});
}

1;

# ----------------------------
# Main
# ----------------------------
package main;

sub main {
  my %opts = (
    bucket => 'bryanchasko-com-webgl-baselines',
    region => 'us-west-2',
    profile => 'aerospaceug-admin',
    verbose => 0,
    dry_run => 0,
  );

  GetOptions(
    'bucket=s' => \$opts{bucket},
    'region=s' => \$opts{region},
    'profile=s' => \$opts{profile},
    'dry-run' => \$opts{dry_run},
    'verbose' => \$opts{verbose},
    'help' => \$opts{help},
  ) or die "Invalid options. Use --help.\n";

  if ($opts{help}) {
    print <<'USAGE';
Usage:
  perl scripts/setup-test-bucket.pl [--bucket NAME] [--region REGION] [--profile PROFILE]
                                     [--dry-run] [--verbose]

Options:
  --bucket    Bucket name (default: bryanchasko-com-webgl-baselines)
  --region    AWS region (default: us-west-2)
  --profile   AWS profile (default: aerospaceug-admin)
  --dry-run   Show what would happen without making AWS calls
  --verbose   Show detailed output

Purpose:
  Creates and configures S3 bucket for WebGL visual regression test baselines.
  
  Features:
  - Versioning enabled (track baseline history)
  - Private access only (CI/CD and local development)
  - AES256 encryption at rest
  - Lifecycle: Expire old versions after 180 days, transition to Glacier after 90 days
  - Tagged for cost allocation

Examples:
  perl scripts/setup-test-bucket.pl
  perl scripts/setup-test-bucket.pl --dry-run --verbose
  perl scripts/setup-test-bucket.pl --bucket my-test-baselines
USAGE
    exit 0;
  }

  my $bucket = $opts{bucket};

  Out::info("S3 Test Baseline Bucket Setup");
  say "  Bucket:  $bucket";
  say "  Region:  $opts{region}";
  say "  Profile: $opts{profile}";
  say "";

  eval {
    my $aws = AWS->new(
      profile => $opts{profile},
      region => $opts{region},
      verbose => $opts{verbose},
      dry_run => $opts{dry_run},
    );

    # Step 1: Check/Create bucket
    if ($aws->bucket_exists($bucket)) {
      Out::ok("Bucket $bucket already exists - updating configuration");
    } else {
      Out::info("Creating S3 bucket...");
      my ($code, $out, $err) = $aws->create_bucket($bucket, $opts{region});
      die Out::err("Failed to create bucket: $err") if $code != 0;
      Out::ok("Bucket created");
    }

    say "";
    Out::info("Configuring bucket...");

    # Step 2: Enable versioning
    Out::info("  Enabling versioning");
    my ($code2, $out2, $err2) = $aws->enable_versioning($bucket);
    die Out::err("Failed to enable versioning: $err2") if $code2 != 0;

    # Step 3: Block public access
    Out::info("  Blocking public access");
    my ($code3, $out3, $err3) = $aws->put_public_access_block($bucket);
    die Out::err("Failed to block public access: $err3") if $code3 != 0;

    # Step 4: Enable encryption
    Out::info("  Enabling default encryption (AES256)");
    my ($code4, $out4, $err4) = $aws->enable_encryption($bucket);
    die Out::err("Failed to enable encryption: $err4") if $code4 != 0;

    # Step 5: Lifecycle policy
    Out::info("  Configuring lifecycle policy (180 day expiration, 90 day Glacier transition)");
    my ($code5, $out5, $err5) = $aws->put_lifecycle_configuration($bucket);
    die Out::err("Failed to set lifecycle policy: $err5") if $code5 != 0;

    # Step 6: Tagging
    Out::info("  Adding tags");
    my ($code6, $out6, $err6) = $aws->put_bucket_tagging($bucket);
    die Out::err("Failed to add tags: $err6") if $code6 != 0;

    say "";
    Out::ok("Bucket $bucket configured successfully");

    say "";
    Out::info("Bucket summary:");
    say "  Name: $bucket";
    say "  Region: $opts{region}";
    say "  Versioning: Enabled";
    say "  Public Access: Blocked";
    say "  Encryption: AES256";
    say "  Lifecycle: 180 day expiration, 90 day Glacier transition";
    say "  Tags: Project=bryanchasko-com, Purpose=WebGL-Test-Baselines, Environment=Testing";
    
    say "";
    Out::info("To use this bucket in tests:");
    say "  1) Ensure AWS credentials configured for profile: $opts{profile}";
    say "  2) Local: ~/.aws/credentials with [$opts{profile}] profile";
    say "  3) CI/CD: Set AWS_ACCESS_KEY_ID and AWS_SECRET_ACCESS_KEY environment variables";
    say "  4) Bucket is auto-detected in tests/helpers/baseline-manager.js";

  }; if ($@) {
    Out::err($@);
    exit 1;
  }

  exit 0;
}

exit(main());
