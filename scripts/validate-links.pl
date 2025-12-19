#!/usr/bin/env perl
use v5.26;
use strict;
use warnings;
use JSON::PP qw(decode_json encode_json);
use File::Find;
use File::Spec;
use Cwd qw(abs_path);
use Time::HiRes qw(time);
use Getopt::Long qw(GetOptions);

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
# Link Validator
# ----------------------------
package LinkValidator;

sub new {
    my ($class, %args) = @_;
    my $public_dir = $args{public_dir} // 'public';
    $public_dir = Cwd::abs_path($public_dir) if $public_dir !~ m{^/};
    
    my $self = {
        public_dir => $public_dir,
        timeout => $args{timeout} // 10,
        verbose => $args{verbose} // 0,
        dry_run => $args{dry_run} // 0,
        check_external => $args{check_external} // 0,
        internal_links => {},
        external_links => {},
        broken_links => [],
        files_scanned => 0,
        links_found => 0,
    };
    bless $self, $class;
    return $self;
}

sub validate {
    my ($self) = @_;
    my $start_time = time();
    
    Out::info("Starting link validation in $self->{public_dir}...");
    
    # Phase 1: Discover all internal links and files
    $self->_discover_links();
    
    # Phase 2: Validate internal links
    my $internal_broken = $self->_validate_internal_links();
    
    # Phase 3: Validate external links (if enabled)
    my $external_broken = 0;
    if ($self->{check_external}) {
        $external_broken = $self->_validate_external_links();
    } else {
        Out::info("Skipping external link validation (use --check-external to enable)");
    }
    
    my $duration = sprintf("%.2f", time() - $start_time);
    $self->_print_summary($internal_broken, $external_broken, $duration);
    
    # Return non-zero exit code if any broken internal links found
    return $internal_broken > 0 ? 1 : 0;
}

sub _discover_links {
    my ($self) = @_;
    
    File::Find::find(sub {
        return unless -f $_ && /\.html$/;
        $self->_extract_links_from_file($File::Find::name);
        Out::info("Processing: $File::Find::name") if $self->{verbose};
    }, $self->{public_dir});
    
    Out::info("Scanned $self->{files_scanned} HTML files, found $self->{links_found} links");
}

sub _extract_links_from_file {
    my ($self, $file_path) = @_;
    
    # Debug: Check if file exists first
    unless (-f $file_path) {
        Out::warn("File does not exist: $file_path");
        return;
    }
    
    open my $fh, '<', $file_path or do {
        Out::warn("Cannot read $file_path: $!");
        return;
    };
    
    my $content = do { local $/; <$fh> };
    close $fh;
    
    $self->{files_scanned}++;
    
    # Extract href attributes from anchor tags
    # Matches both quoted and unquoted href attributes
    while ($content =~ /<a[^>]*?href=(?:["']([^"']+)["']|([^\s>]+))[^>]*>/gi) {
        my $href = $1 || $2; # First group for quoted, second for unquoted
        next if !defined $href || $href eq '';
        
        if ($self->{verbose}) {
            Out::info("Found href: '$href' in $file_path");
        }
        
        $self->_categorize_link($href, $file_path);
        $self->{links_found}++;
    }
}

sub _categorize_link {
    my ($self, $href, $source_file) = @_;
    
    # Skip certain link types
    return if $href =~ /^(?:mailto:|tel:|javascript:|#)/;
    return if $href =~ /^data:/;
    
    if ($href =~ /^https?:\/\//) {
        # Skip domains that commonly block automated requests or rate limit
        return if $href =~ m{^https?://(?:
            (?:www\.)?linkedin\.com |
            x\.com |
            twitter\.com |
            t\.co |
            news\.ycombinator\.com |
            (?:www\.)?upwork\.com
        )}xi;
        
        # External link
        $self->{external_links}{$href} //= [];
        push @{$self->{external_links}{$href}}, $source_file;
    } else {
        # Internal link (relative or absolute path)
        my $clean_href = $href;
        $clean_href =~ s/#.*$//; # Remove anchors
        $clean_href =~ s/\?.*$//; # Remove query parameters
        
        return if $clean_href eq ''; # Pure anchor/query links
        
        if ($self->{verbose}) {
            Out::info("Found internal link: $clean_href");
        }
        
        $self->{internal_links}{$clean_href} //= [];
        push @{$self->{internal_links}{$clean_href}}, $source_file;
    }
}

sub _validate_internal_links {
    my ($self) = @_;
    my $broken = 0;
    
    Out::info("Validating " . scalar(keys %{$self->{internal_links}}) . " internal links...");
    
    for my $link (sort keys %{$self->{internal_links}}) {
        my $resolved_path = $self->_resolve_internal_path($link);
        
        unless (-e $resolved_path) {
            $broken++;
            push @{$self->{broken_links}}, {
                type => 'internal',
                url => $link,
                resolved_path => $resolved_path,
                sources => $self->{internal_links}{$link},
            };
            
            if ($self->{verbose}) {
                Out::err("BROKEN: $link");
                Out::info("  Resolved to: $resolved_path");
                Out::info("  Found in: " . join(', ', @{$self->{internal_links}{$link}}));
            }
        } elsif ($self->{verbose}) {
            Out::ok("OK: $link");
        }
    }
    
    return $broken;
}

sub _resolve_internal_path {
    my ($self, $link) = @_;
    
    # Handle absolute paths from site root
    if ($link =~ /^\//) {
        $link = substr($link, 1); # Remove leading slash
    }
    
    my $path = File::Spec->catfile($self->{public_dir}, $link);
    
    # If it's a directory reference, check for index.html
    if (-d $path) {
        $path = File::Spec->catfile($path, 'index.html');
    }
    # If no extension and not a directory, try adding index.html
    elsif ($link !~ /\.[^\/]*$/ && !-e $path) {
        my $with_index = File::Spec->catfile($path, 'index.html');
        $path = $with_index if -e $with_index;
    }
    
    return $path;
}

sub _validate_external_links {
    my ($self) = @_;
    my $broken = 0;
    
    my $external_count = scalar(keys %{$self->{external_links}});
    Out::info("Validating $external_count external links using curl...");
    
    for my $url (sort keys %{$self->{external_links}}) {
        next if $self->{dry_run};
        
        Out::info("Checking: $url") if $self->{verbose};
        
        # Use curl for external link validation
        my $cmd = "curl -I --connect-timeout $self->{timeout} --max-time $self->{timeout} -s -o /dev/null -w '%{http_code}' " . 
                  quotemeta($url) . " 2>/dev/null";
        
        my $status_code = `$cmd`;
        chomp($status_code);
        
        # Consider 2xx and 3xx as success
        unless ($status_code =~ /^[23]\d\d$/) {
            $broken++;
            push @{$self->{broken_links}}, {
                type => 'external',
                url => $url,
                status => $status_code || 'Connection failed',
                reason => $self->_http_status_reason($status_code),
                sources => $self->{external_links}{$url},
            };
            
            if ($self->{verbose}) {
                my $reason = $self->_http_status_reason($status_code);
                Out::err("BROKEN: $url ($status_code $reason)");
                Out::info("  Found in: " . join(', ', @{$self->{external_links}{$url}}));
            }
        } elsif ($self->{verbose}) {
            Out::ok("OK: $url ($status_code)");
        }
        
        # Rate limiting for external requests
        select(undef, undef, undef, 0.1);
    }
    
    return $broken;
}

sub _http_status_reason {
    my ($self, $code) = @_;
    
    return 'Connection failed' unless $code;
    
    my %reasons = (
        200 => 'OK',
        301 => 'Moved Permanently',
        302 => 'Found',
        304 => 'Not Modified',
        400 => 'Bad Request',
        401 => 'Unauthorized', 
        403 => 'Forbidden',
        404 => 'Not Found',
        429 => 'Too Many Requests',
        500 => 'Internal Server Error',
        502 => 'Bad Gateway',
        503 => 'Service Unavailable',
    );
    
    return $reasons{$code} // 'Unknown Status';
}

sub _print_summary {
    my ($self, $internal_broken, $external_broken, $duration) = @_;
    
    Out::info("Link validation completed in ${duration}s");
    Out::info("Files scanned: $self->{files_scanned}");
    Out::info("Links found: $self->{links_found}");
    
    my $internal_total = scalar(keys %{$self->{internal_links}});
    my $external_total = scalar(keys %{$self->{external_links}});
    
    Out::info("Internal links: $internal_total (" . ($internal_total - $internal_broken) . " OK, $internal_broken broken)");
    
    if ($self->{check_external}) {
        Out::info("External links: $external_total (" . ($external_total - $external_broken) . " OK, $external_broken broken)");
    } else {
        Out::info("External links: $external_total (not validated)");
    }
    
    # Detailed broken link report
    if (@{$self->{broken_links}}) {
        Out::err("\nBROKEN LINKS FOUND:");
        for my $link (@{$self->{broken_links}}) {
            if ($link->{type} eq 'internal') {
                Out::err("  $link->{url}");
                Out::info("    Resolved to: $link->{resolved_path}");
            } else {
                Out::err("  $link->{url} ($link->{status} $link->{reason})");
            }
            Out::info("    Found in: " . join(', ', @{$link->{sources}}));
        }
    } else {
        Out::ok("\nAll validated links are working! 🎉");
    }
}

sub export_results {
    my ($self, $output_file) = @_;
    
    my $report = {
        timestamp => time(),
        summary => {
            files_scanned => $self->{files_scanned},
            links_found => $self->{links_found},
            internal_links => scalar(keys %{$self->{internal_links}}),
            external_links => scalar(keys %{$self->{external_links}}),
            broken_links => scalar(@{$self->{broken_links}}),
        },
        broken_links => $self->{broken_links},
    };
    
    open my $fh, '>:encoding(UTF-8)', $output_file or die "Cannot write $output_file: $!";
    print $fh encode_json($report);
    close $fh;
    
    Out::ok("Link validation report saved to $output_file");
}

1;

# ----------------------------
# Main
# ----------------------------
package main;

sub main {
    my %opts = (
        public_dir => 'public',
        timeout => 10,
        verbose => 0,
        dry_run => 0,
        check_external => 0,
        output => undef,
    );
    
    GetOptions(
        'public-dir=s' => \$opts{public_dir},
        'timeout=i' => \$opts{timeout},
        'check-external' => \$opts{check_external},
        'output=s' => \$opts{output},
        'verbose' => \$opts{verbose},
        'dry-run' => \$opts{dry_run},
        'help' => \$opts{help},
    ) or die "Invalid options. Use --help.\n";
    
    if ($opts{help}) {
        print <<'USAGE';
Usage:
  perl scripts/validate-links.pl [options]

Options:
  --public-dir DIR      Directory containing built HTML files (default: public)
  --check-external      Validate external links (slow, disabled by default)
  --timeout SECONDS     HTTP timeout for external links (default: 10)
  --output FILE         Export results to JSON file
  --verbose             Show detailed progress
  --dry-run             Don't make HTTP requests for external links
  --help                Show this help message

Examples:
  # Quick internal-only validation
  perl scripts/validate-links.pl

  # Full validation including external links
  perl scripts/validate-links.pl --check-external --verbose

  # Validation with JSON report
  perl scripts/validate-links.pl --output link-report.json
  
Exit codes:
  0 - No broken internal links found
  1 - Broken internal links found
USAGE
        exit 0;
    }
    
    unless (-d $opts{public_dir}) {
        Out::err("Public directory '$opts{public_dir}' does not exist. Run 'hugo' first.");
        exit 2;
    }
    
    eval {
        my $validator = LinkValidator->new(
            public_dir => $opts{public_dir},
            timeout => $opts{timeout},
            verbose => $opts{verbose},
            dry_run => $opts{dry_run},
            check_external => $opts{check_external},
        );
        
        my $exit_code = $validator->validate();
        
        if ($opts{output}) {
            $validator->export_results($opts{output});
        }
        
        exit $exit_code;
    };
    if ($@) {
        Out::err("Link validation failed: $@");
        exit 2;
    }
}

exit(main());