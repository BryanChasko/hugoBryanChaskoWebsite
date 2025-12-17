# uploading this file to your private repo
git add -f _AWS_ENVIRONMENT_DETAILS.md _README_HOSTING.md bucket-policy.json cloudfront-config.json cloudfront-dns-record.json cors.json current-bucket-policy.json dns-record.json

 1 file changed, 156 insertions(+)
 create mode 100644 _README_HOSTING.md

git commit -m "Added _README_HOSTING.md to private repository"
[main f579a4c] Added _README_HOSTING.md to private repository
 1 file changed, 156 insertions(+)
 create mode 100644 _README_HOSTING.md

➜  bryanChaskoHugo git:(main) ✗ git remote add private-repo https://github.com/BryanChasko/hugoBryanChaskoWebsitePrivate.git

➜  bryanChaskoHugo git:(main) ✗ git push private-repo main
Enumerating objects: 203, done.
Counting objects: 100% (203/203), done.
Delta compression using up to 24 threads
Compressing objects: 100% (176/176), done.
Writing objects: 100% (203/203), 110.12 KiB | 6.12 MiB/s, done.
Total 203 (delta 93), reused 0 (delta 0), pack-reused 0
remote: Resolving deltas: 100% (93/93), done.
To https://github.com/BryanChasko/hugoBryanChaskoWebsitePrivate.git
 * [new branch]      main -> main

# STEPS TAKEN TO DEPLOY

## Create The Bucket
aws s3api create-bucket --bucket bryanchasko.com --create-bucket-configuration LocationConstraint=us-west-2

{
    "Location": "http://bryanchasko.com.s3.amazonaws.com/"
}

## enable static website hosting on the bucket
aws s3 website s3://bryanchasko.com --index-document index.html

## remove the block to public access default in bucket settings
aws s3api put-public-access-block --bucket bryanchasko-hugo-website --public-access-block-configuration 'BlockPublicAcls=false,IgnorePublicAcls=false,BlockPublicPolicy=false,RestrictPublicBuckets=false'

## create a bucket policy to allow public read access
cat <<EOT > bucket-policy.json
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Sid": "PublicReadGetObject",
      "Effect": "Allow",
      "Principal": "*",
      "Action": "s3:GetObject",
      "Resource": "arn:aws:s3:::bryanchasko-hugo-website/*"
    }
  ]
}
EOT

## Apply the policy 
aws s3api put-bucket-policy --bucket bryanchasko-hugo-website --policy file://bucket-policy.json

## build and upload your hugo site
in your terminal run "hugo" to build. your build will exist in the /public directory so that's what you'll need to sync to s3

## sync your public directory to s3
aws s3 sync public/ s3://bryanchasko-hugo-website

## remove block to public access to make web accessible from browsers
aws s3api put-public-access-block --bucket bryanchasko.com --public-access-block-configuration BlockPublicAcls=false,IgnorePublicAcls=false,BlockPublicPolicy=false,RestrictPublicBuckets=false

## set a redirect for your alias (www.)
aws s3api create-bucket --bucket www.bryanchasko.com --create-bucket-configuration LocationConstraint=us-west-2

## create dns record sets

cat > dns-record.json <<EOL
{
  "Comment": "Update record to point to S3 bucket",
  "Changes": [
    {
      "Action": "UPSERT",
      "ResourceRecordSet": {
        "Name": "bryanchasko.com",
        "Type": "A",
        "AliasTarget": {
          "HostedZoneId": "Z3BJ6K6RIION7M",
          "DNSName": "s3-website-us-west-2.amazonaws.com",
          "EvaluateTargetHealth": false
        }
      }
    }
  ]
}
EOL

aws route53 change-resource-record-sets --hosted-zone-id <hosted zone id> --change-batch file://dns-record.json


    "ChangeInfo": {
        "Id": "/change/C048964832AWIXLJM4AU2",
        "Status": "PENDING",
        "SubmittedAt": "2024-07-29T18:21:57.379000+00:00",
        "Comment": "Update record to point to S3 bucket"
    }
}

# setup https
## request a certificate and get its arn- NOTE THAT YOU MUST REQUEST IN US-EAST-1
aws acm request-certificate --domain-name bryanchasko.com --validation-method DNS --region us-east-1

{
    "CertificateArn": "<>"
}

## Create a CloudFront distribution with the S3 bucket as the origin and the ACM certificate for HTTP

cat > cloudfront-config.json <<EOL
{
  "CallerReference": "unique-string",
  "Aliases": {
    "Quantity": 1,
    "Items": ["bryanchasko.com"]
  },
  "DefaultRootObject": "index.html",
  "Origins": {
    "Quantity": 1,
    "Items": [
      {
        "Id": "<>",
        "DomainName": "<>",
        "OriginPath": "",
        "CustomHeaders": {
          "Quantity": 0
        },
        "S3OriginConfig": {
          "OriginAccessIdentity": ""
        }
      }
    ]
  },
  "DefaultCacheBehavior": {
    "TargetOriginId": "S3-bryanchasko-com",
    "ViewerProtocolPolicy": "redirect-to-https",
    "AllowedMethods": {
      "Quantity": 2,
      "Items": ["GET", "HEAD"],
      "CachedMethods": {
        "Quantity": 2,
        "Items": ["GET", "HEAD"]
      }
    },
    "ForwardedValues": {
      "QueryString": false,
      "Cookies": {
        "Forward": "none"
      },
      "Headers": {
        "Quantity": 0
      },
      "QueryStringCacheKeys": {
        "Quantity": 0
      }
    },
    "MinTTL": 0,
    "DefaultTTL": 86400,
    "MaxTTL": 31536000
  },
  "Comment": "CloudFront distribution for bryanchasko.com",
  "Enabled": true,
  "ViewerCertificate": {
    "ACMCertificateArn": "<arn here>",
    "SSLSupportMethod": "sni-only",
    "MinimumProtocolVersion": "TLSv1.2_2018"
  }
}
EOL

aws route53 change-resource-record-sets --hosted-zone-id <hosted zone id> --change-batch file://cloudfront-dns-record.json


### TIPS AND TRICKS
see dns settings using hosted zone details' "hosted zone ID" from console
aws route53 list-resource-record-sets --hosted-zone-id <hosted zone id>

## Deploy Script (safe & cache-aware)

To build, upload, and always invalidate CloudFront safely without committing secrets, use `scripts/deploy.pl`.

- Reads config from environment, your home file (`~/.bcc-site/config.json`), or AWS SSM Parameter Store.
- Auto-detects bucket region; finds CloudFront distribution by alias when possible.
- Always runs an invalidation (`/*`) after upload.

Quick start:

```bash
# one-off dry-run (no external calls)
perl scripts/deploy.pl --dry-run --verbose

# normal deploy
perl scripts/deploy.pl --profile aerospaceug-admin
```

Optional SSM layout (low-cost):

```bash
aws ssm put-parameter --name /sites/bryanchasko.com/s3_bucket --type String --value bryanchasko.com
aws ssm put-parameter --name /sites/bryanchasko.com/domain    --type String --value bryanchasko.com
aws ssm put-parameter --name /sites/bryanchasko.com/cloudfront_distribution_id --type String --value <CF_DISTRIBUTION_ID>
```

Then:

```bash
perl scripts/deploy.pl --profile aerospaceug-admin --param-path /sites/bryanchasko.com
```