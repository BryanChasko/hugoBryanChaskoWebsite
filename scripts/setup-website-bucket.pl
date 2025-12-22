#!/usr/bin/env perl
use v5.26;
use strict;
use warnings;
use JSON::PP qw(decode_json encode_json);
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
  my @cmd = ($self->_base_args, 's3api', 'create-bucket', '--bucket', $bucket, '--acl', 'private');
  
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
  my $config = JSON::PP::encode_json({
    Rules => [{
      ApplyServerSideEncryptionByDefault => { SSEAlgorithm => 'AES256' }
    }]
  });
  my @cmd = ($self->_base_args, 's3api', 'put-bucket-encryption', '--bucket', $bucket,
    '--server-side-encryption-configuration', $config);
  return Util::run(\@cmd, verbose=>0, dry_run=>$self->{dry_run});
}

sub enable_website_hosting {
  my ($self, $bucket) = @_;
  my $config = JSON::PP::encode_json({
    IndexDocument => { Suffix => 'index.html' },
    ErrorDocument => { Key => '404.html' }
  });
  my @cmd = ($self->_base_args, 's3api', 'put-bucket-website', '--bucket', $bucket,
    '--website-configuration', $config);
  return Util::run(\@cmd, verbose=>0, dry_run=>$self->{dry_run});
}

1;

# ----------------------------
# Main
# ----------------------------
package main;

sub main {
  my %opts = (
    domain => 'bryanchasko.com',
    region => 'us-west-2',
    profile => 'websites-bryanchasko',
    verbose => 0,
    dry_run => 0,
  );

  GetOptions(
    'domain=s' => \$opts{domain},
    'region=s' => \$opts{region},
    'profile=s' => \$opts{profile},
    'dry-run' => \$opts{dry_run},
    'verbose' => \$opts{verbose},
    'help' => \$opts{help},
  ) or die "Invalid options. Use --help.\n";

  if ($opts{help}) {
    print <<'USAGE';
Usage:
  perl scripts/setup-website-bucket.pl [--domain DOMAIN] [--region REGION] [--profile PROFILE]
                                        [--dry-run] [--verbose]

Options:
  --domain    Domain name (used as bucket name, default: bryanchasko.com)
  --region    AWS region (default: us-west-2)
  --profile   AWS profile (default: websites-bryanchasko)
  --dry-run   Show what would happen without making AWS calls
  --verbose   Show detailed output

Examples:
  perl scripts/setup-website-bucket.pl
  perl scripts/setup-website-bucket.pl --dry-run --verbose
  perl scripts/setup-website-bucket.pl --domain example.com --region us-east-1
USAGE
    exit 0;
  }

  my $bucket = $opts{domain};

  Out::info("S3 Website Bucket Setup");
  say "  Domain:  $opts{domain}";
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
      Out::ok("Bucket $bucket already exists");
    } else {
      Out::info("Creating S3 bucket...");
      my ($code, $out, $err) = $aws->create_bucket($bucket, $opts{region});
      die Out::err("Failed to create bucket: $err") if $code != 0;
      Out::ok("Bucket created");
    }

    say "";
    Out::info("Configuring bucket...");

    # Step 2: Block public access
    Out::info("  Blocking public access");
    my ($code2, $out2, $err2) = $aws->put_public_access_block($bucket);
    die Out::err("Failed to block public access: $err2") if $code2 != 0;

    # Step 3: Enable versioning
    Out::info("  Enabling versioning");
    my ($code3, $out3, $err3) = $aws->enable_versioning($bucket);
    die Out::err("Failed to enable versioning: $err3") if $code3 != 0;

    # Step 4: Enable encryption
    Out::info("  Enabling default encryption (AES256)");
    my ($code4, $out4, $err4) = $aws->enable_encryption($bucket);
    die Out::err("Failed to enable encryption: $err4") if $code4 != 0;

    # Step 5: Enable website hosting
    Out::info("  Enabling static website hosting");
    my ($code5, $out5, $err5) = $aws->enable_website_hosting($bucket);
    die Out::err("Failed to enable website hosting: $err5") if $code5 != 0;

    say "";
    Out::ok("Bucket $bucket configured successfully");

    say "";
    Out::info("Next steps:");
    say "  1) Create config file outside the repo:";
    say "     mkdir -p ~/.bcc-site";
    say "     cat > ~/.bcc-site/config.json << 'EOF'";
    say "{";
    say "  \"SITE_DOMAIN\": \"$opts{domain}\",";
    say "  \"SITE_BUCKET\": \"$bucket\",";
    say "  \"SITE_DISTRIBUTION_ID\": \"YOUR_CLOUDFRONT_DISTRIBUTION_ID\",";
    say "  \"AWS_PROFILE\": \"$opts{profile}\",";
    say "  \"AWS_REGION\": \"$opts{region}\"";
    say "}";
    say "EOF";
    say "";
    say "  2) Test dry-run deploy:";
    say "     perl scripts/deploy.pl --dry-run --verbose";
    say "";
    say "  3) Real deploy (after setting CloudFront distribution ID):";
    say "     perl scripts/deploy.pl --verbose";

  }; if ($@) {
    Out::err($@);
    exit 1;
  }

  exit 0;
}

exit(main());
