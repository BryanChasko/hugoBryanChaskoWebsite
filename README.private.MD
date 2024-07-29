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

aws route53 change-resource-record-sets --hosted-zone-id Z09216723VDB0N04DM9LL --change-batch file://dns-record.json


    "ChangeInfo": {
        "Id": "/change/C048964832AWIXLJM4AU2",
        "Status": "PENDING",
        "SubmittedAt": "2024-07-29T18:21:57.379000+00:00",
        "Comment": "Update record to point to S3 bucket"
    }
}

# setup https
## request a certificate and get its arn
aws acm request-certificate --domain-name bryanchasko.com --validation-method DNS --region us-west-2

{
    "CertificateArn": "arn:aws:acm:us-west-2:211125425201:certificate/6b265cac-9099-441c-b66a-508363db3be7"
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
        "Id": "S3-bryanchasko-com",
        "DomainName": "bryanchasko.com.s3-website-us-west-2.amazonaws.com",
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
    "ACMCertificateArn": "arn:aws:acm:us-west-2:211125425201:certificate/6b265cac-9099-441c-b66a-508363db3be7",
    "SSLSupportMethod": "sni-only",
    "MinimumProtocolVersion": "TLSv1.2_2018"
  }
}
EOL

aws route53 change-resource-record-sets --hosted-zone-id Z09216723VDB0N04DM9LL --change-batch file://cloudfront-dns-record.json


### TIPS AND TRICKS
see dns settings using hosted zone details' "hosted zone ID" from console
aws route53 list-resource-record-sets --hosted-zone-id Z09216723VDB0N04DM9LL