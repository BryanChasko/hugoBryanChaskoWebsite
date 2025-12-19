#!/usr/bin/env perl
use v5.26;
use strict;
use warnings;
use Cwd qw(getcwd);
use File::Spec;
use IPC::Open3;
use Symbol qw(gensym);

my @patterns = (
  'cloudfront-backup*.json',
  'current-distribution-config.json',
  'fixed-distribution-config.json',
  'test-debug-output*.txt',
  'test-output*.txt',
  'test-orbit*.log',
);

my $repo_root = getcwd();
my @removed;

for my $pattern (@patterns) {
  my $glob_path = File::Spec->catfile($repo_root, $pattern);
  for my $path (glob $glob_path) {
    next unless -f $path;
    if (remove_file($path) == 0) {
      push @removed, File::Spec->abs2rel($path, $repo_root);
    }
  }
}

if (@removed) {
  say "Removed the following local infra/test artifacts:";
  say "  $_" for @removed;
} else {
  say 'No infra/test dump files were present to clean.';
}

sub remove_file {
  my ($path) = @_;
  my $err = gensym;
  my $pid = open3(undef, my $out, $err, 'rm', '-f', '--', $path);
  waitpid($pid, 0);
  my $code = $? >> 8;
  local $/;
  my $errout = <$err> // '';
  if ($code != 0) {
    warn "Failed to delete $path: $errout";
  }
  return $code;
}
