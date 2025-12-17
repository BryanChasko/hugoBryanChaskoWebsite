#!/usr/bin/env perl
use v5.26;
use strict;
use warnings;
use JSON::PP qw(decode_json);
use IPC::Open3;
use Symbol qw(gensym);
use Getopt::Long qw(GetOptions);
use Cwd qw(getcwd);
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

  # Dry-run short circuit
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

sub which {
  my ($bin) = @_;
  for my $p (split /:/, ($ENV{PATH}//'')) {
    my $f = File::Spec->catfile($p, $bin);
    return $f if -x $f;
  }
  return undef;
}

sub trim { my($s)=@_; $s//= ''; $s=~s/^\s+|\s+$//g; $s }

sub read_file {
  my ($path) = @_;
  return undef unless -f $path;
  open my $fh, '<', $path or return undef;
  local $/; my $c = <$fh>; close $fh; return $c;
}

sub parse_toml_baseurl {
  my ($content) = @_;
  return undef unless defined $content;
  if ($content =~ /^\s*baseURL\s*=\s*"(.*?)"\s*$/mi) {
    my $url = $1; $url =~ s{^https?://}{}; $url =~ s{/$}{}; return $url;
  }
  return undef;
}

sub domain_from_url {
  my ($host) = @_;
  return undef unless $host; $host =~ s{^https?://}{}; $host =~ s{/$}{}; $host =~ s{/.*$}{}; return $host;
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
  return Util::run(\@cmd, verbose=>$self->{verbose});
}

sub ensure_bucket_region {
  my ($self, $bucket) = @_;
  return if $self->{region};
  my ($code, $out, $err) = $self->aws_json('s3api','get-bucket-location','--bucket',$bucket);
  if ($code==0) {
    my $data = eval { decode_json($out) } || {};
    my $loc = $data->{LocationConstraint};
    $self->{region} = $loc // 'us-east-1';
    Out::info("Using S3 bucket region: $self->{region}");
  } else {
    Out::warn("Could not detect bucket region; proceeding w/out --region");
  }
}

sub s3_sync_public {
  my ($self, $bucket) = @_;
  $self->ensure_bucket_region($bucket) unless $self->{dry_run};
  my @cmd = ($self->_base_args, 's3', 'sync', 'public/', "s3://$bucket", '--delete');
  return Util::run(\@cmd, verbose=>1, dry_run=>$self->{dry_run});
}

sub hugo_build {
  my ($self, $minify) = @_;
  my $hugo = Util::which('hugo');
  if (!$hugo) { return (1, '', 'hugo not found in PATH') unless $self->{dry_run}; }
  my @cmd = ('hugo'); push @cmd, '--minify' if $minify;
  return Util::run(\@cmd, verbose=>1, dry_run=>$self->{dry_run});
}

sub ssm_get_param {
  my ($self, $name, $with_dec) = @_;
  return (undef, 'dry-run') if $self->{dry_run};
  my @cmd = ('ssm','get-parameter','--name',$name); push @cmd,'--with-decryption' if $with_dec;
  my ($code,$out,$err) = $self->aws_json(@cmd);
  return (undef,$err) if $code!=0;
  my $data = eval { decode_json($out) } || {};
  return ($data->{Parameter}{Value}, '');
}

sub cloudfront_invalidate {
  my ($self, $dist_id, $paths) = @_;
  my @cmd = ($self->_base_args,'cloudfront','create-invalidation','--distribution-id',$dist_id,'--paths',$paths// '/*');
  return Util::run(\@cmd, verbose=>1, dry_run=>$self->{dry_run});
}

sub find_distribution_by_alias {
  my ($self, $domain) = @_;
  return ('DRYRUN', '') if $self->{dry_run};
  my ($code,$out,$err) = $self->aws_json('cloudfront','list-distributions');
  return (undef, "list-distributions failed: $err") if $code!=0;
  my $data = eval { decode_json($out) } || {};
  my $items = $data->{DistributionList}{Items} // [];
  for my $d (@$items) {
    my $aliases = $d->{Aliases}{Items} // [];
    for my $al (@$aliases) { return ($d->{Id}, '') if lc($al) eq lc($domain) || lc($al) eq 'www.'.lc($domain); }
  }
  return (undef, "No CloudFront distribution found for alias $domain");
}

1;

# ----------------------------
# Config Providers
# ----------------------------
package ConfigProvider; sub get { die 'abstract' }

package EnvProvider; use parent -norequire, 'ConfigProvider';
sub new { my($class)=@_; bless {}, $class }
sub get {
  my ($self,$key)=@_;
  my %map=( bucket=>$ENV{SITE_BUCKET}, domain=>$ENV{SITE_DOMAIN}, distid=>$ENV{SITE_DISTRIBUTION_ID}, profile=>$ENV{AWS_PROFILE}, region=>$ENV{AWS_REGION}, param_path=>$ENV{SITE_PARAM_PATH} );
  return $map{$key};
}

package HomeFileProvider; use parent -norequire, 'ConfigProvider';
sub new { my($class)=@_; bless { cache=>undef }, $class }
sub _load { my($self)=@_; return if defined $self->{cache}; my $path=$ENV{SITE_CONFIG_FILE}; if(!$path){ my $home=$ENV{HOME}//''; $path=File::Spec->catfile($home,'.bcc-site','config.json'); } if(-f $path){ my $c=Util::read_file($path); eval{ $self->{cache}=decode_json($c) } or do { $self->{cache}={} } } else { $self->{cache}={} } }
sub get { my($self,$key)=@_; $self->_load; my %map=( bucket=>$self->{cache}{SITE_BUCKET}, domain=>$self->{cache}{SITE_DOMAIN}, distid=>$self->{cache}{SITE_DISTRIBUTION_ID}, profile=>$self->{cache}{AWS_PROFILE}, region=>$self->{cache}{AWS_REGION}, param_path=>$self->{cache}{SITE_PARAM_PATH} ); return $map{$key}; }

package SSMProvider; use parent -norequire, 'ConfigProvider';
sub new { my($class,%args)=@_; bless { aws=>$args{aws}, param_path=>$args{param_path} }, $class }
sub _param { my($self,$leaf)=@_; return undef unless $self->{param_path}; (my $base=$self->{param_path}) =~ s{/$}{}; return "$base/$leaf" }
sub get {
  my ($self,$key)=@_;
  my %leaf=( bucket=>'s3_bucket', domain=>'domain', distid=>'cloudfront_distribution_id', profile=>'aws_profile', region=>'aws_region' );
  my $leafname=$leaf{$key} or return undef; my $name=$self->_param($leafname) or return undef;
  my ($v,$err)=$self->{aws}->ssm_get_param($name,0); return $v if defined $v; return undef;
}

1;

# ----------------------------
# Orchestrator
# ----------------------------
package Deployer;
sub new { my($class,%args)=@_; bless { aws=>$args{aws}, verbose=>$args{verbose}//0 }, $class }

sub resolve_config {
  my ($self,%opts)=@_;
  my $aws = $self->{aws};
  my $hugo_toml = Util::read_file('hugo.toml');
  my $from_toml = Util::parse_toml_baseurl($hugo_toml);
  my $toml_domain = Util::domain_from_url($from_toml);

  my $env  = EnvProvider->new; my $home = HomeFileProvider->new;
  my $param_path = $opts{param_path} // $env->get('param_path') // $home->get('param_path');
  my $ssm = SSMProvider->new(aws=>$aws, param_path=>$param_path);

  my $domain = $opts{domain} // $env->get('domain') // $home->get('domain') // $ssm->get('domain') // $toml_domain;
  my $bucket = $opts{bucket} // $env->get('bucket') // $home->get('bucket') // $ssm->get('bucket') // $domain;
  my $distid = $opts{distribution_id} // $env->get('distid') // $home->get('distid') // $ssm->get('distid');

  my $profile = $opts{profile} // $env->get('profile') // $home->get('profile');
  my $region  = $opts{region}  // $env->get('region')  // $home->get('region');
  $aws->{profile}=$profile if $profile; $aws->{region}=$region if $region; $aws->{dry_run}=$opts{dry_run} // 0;

  Out::info("cfg: domain=$domain bucket=$bucket profile=".($aws->{profile}//'(unset)')." region=".($aws->{region}//'(auto)')) if $self->{verbose};

  if (!$distid && $domain && !$opts{dry_run}) {
    my ($found,$err) = $aws->find_distribution_by_alias($domain);
    $distid = $found if $found;
    Out::warn($err) if !$found && $self->{verbose};
  }

  # When dry-run, don't abort hard; fill placeholders
  $distid ||= 'DRYRUN' if $opts{dry_run};
  $bucket ||= $domain  if $opts{dry_run};

  die "Domain could not be determined. Set --domain or SITE_DOMAIN." unless $domain;
  die "Bucket could not be determined. Set --bucket or SITE_BUCKET." unless $bucket;
  die "CloudFront distribution ID missing. Provide --distribution-id or configure lookup." unless $distid;

  return (domain=>$domain, bucket=>$bucket, distribution_id=>$distid, profile=>$aws->{profile}, region=>$aws->{region});
}

sub deploy {
  my ($self,%opts)=@_;
  my %cfg = $self->resolve_config(%opts);

  Out::info("Build: ".($opts{skip_build}||$opts{invalidate_only}?'skip':'run').", Upload: ".($opts{skip_upload}||$opts{invalidate_only}?'skip':'run').", Invalidate: run");

  if (!$opts{skip_build} && !$opts{invalidate_only}) {
    Out::info('Building site with Hugo…');
    my ($bc,$bo,$be) = $self->{aws}->hugo_build($opts{minify},);
    die Out::err("Hugo build failed") if $bc!=0;
    Out::ok('Hugo build complete');
  }

  if (!$opts{skip_upload} && !$opts{invalidate_only}) {
    Out::info("Syncing public/ to s3://$cfg{bucket} …");
    my ($sc,$so,$se) = $self->{aws}->s3_sync_public($cfg{bucket});
    die Out::err('S3 sync failed') if $sc!=0;
    Out::ok('S3 sync complete');
  }

  Out::info("Invalidating CloudFront distribution $cfg{distribution_id} (paths=".($opts{paths}//'/*').") …");
  my ($ic,$io,$ie) = $self->{aws}->cloudfront_invalidate($cfg{distribution_id}, $opts{paths}//'/*');
  die Out::err('CloudFront invalidation failed') if $ic!=0;
  Out::ok('CloudFront invalidation submitted');

  Out::ok('Done.');
}

1;

# ----------------------------
# Main
# ----------------------------
package main;

sub main {
  my %opts=( minify=>1, paths=>'/*', verbose=>0, dry_run=>0, skip_build=>0, skip_upload=>0, invalidate_only=>0 );
  GetOptions(
    'profile=s'=>\$opts{profile}, 'region=s'=>\$opts{region}, 'bucket=s'=>\$opts{bucket}, 'domain=s'=>\$opts{domain},
    'distribution-id=s'=>\$opts{distribution_id}, 'param-path=s'=>\$opts{param_path}, 'paths=s'=>\$opts{paths},
    'minify!' =>\$opts{minify}, 'skip-build'=>\$opts{skip_build}, 'skip-upload'=>\$opts{skip_upload},
    'invalidate-only'=>\$opts{invalidate_only}, 'dry-run'=>\$opts{dry_run}, 'verbose'=>\$opts{verbose}, 'help'=>\$opts{help},
  ) or die "Invalid options. Use --help.\n";

  if ($opts{help}) {
    print <<'USAGE';
Usage:
  perl scripts/deploy.pl [--profile PROFILE] [--region REGION]
                         [--bucket BUCKET] [--domain DOMAIN]
                         [--distribution-id ID] [--param-path /path]
                         [--paths "/*"] [--no-minify]
                         [--skip-build] [--skip-upload] [--invalidate-only]
                         [--dry-run] [--verbose]

Config priority: CLI > ENV (SITE_*, AWS_*) > ~/.bcc-site/config.json > SSM path > hugo.toml baseURL (domain)
Always invalidates CloudFront. Build+upload run unless skipped. Dry-run avoids external calls and uses placeholders.

ENV:
  SITE_DOMAIN, SITE_BUCKET, SITE_DISTRIBUTION_ID, SITE_PARAM_PATH, SITE_CONFIG_FILE
  AWS_PROFILE, AWS_REGION
USAGE
    exit 0;
  }

  eval {
    my $aws = AWS->new(profile=>$opts{profile}//$ENV{AWS_PROFILE}, region=>$opts{region}//$ENV{AWS_REGION}, verbose=>$opts{verbose}//0, dry_run=>$opts{dry_run}//0);
    my $runner = Deployer->new(aws=>$aws, verbose=>$opts{verbose}//0);
    $runner->deploy(%opts);
  }; if ($@) { Out::err(Util::trim($@)); exit 1 }
  exit 0;
}

exit(main());
