# Bryan Chasko - People from the Past 🌿🦊🌸

Development Command:
hugo server --config config.dev.toml

Production Command:
hugo --config config.prod.toml

## Why Hugo and Amazon S3? 🌱

### Hugo 🌻
Hugo is a fast, secure static site generator that converts markdown files into static HTML. It's highly customizable, perfect for creating a personal or business website. Hugo is a highly popular static site generator, created by Steve Francia in 2013 and maintained by Bjørn Erik Pedersen along with other contributors from the community. Francia is from the USA, and Pedersen is from Norway. Hugo is well-regarded for its speed and simplicity, which comes from being written in Go.

In terms of security, Hugo’s use of a static site generator (SSG) approach means that it does not have a backend that can be exploited by attackers. The Department of Defense and other security communities generally advocate for SSGs like Hugo for their inherent security benefits over dynamic content management systems (CMS) because there are fewer vulnerabilities without the presence of a backend and a database.

Statistics supporting Hugo’s choice for a static site include its use by notable high-visibility sites such as Brave (brave.com), DigitalOcean documentation (docs.digitalocean.com), Docker documentation (docs.docker.com), and Kubernetes (kubernetes.io). These sites highlight Hugo’s robustness, performance, and flexibility🌺

### Amazon S3 🌿
Amazon S3 provides scalable object storage with high availability and security. It is cost-effective for static website hosting, ensuring low latency and high performance. 🐾

**Scalability and Availability**  
Amazon S3 automatically scales to handle thousands of requests per second, ensuring that your website remains responsive even during high traffic periods. S3 offers a service level agreement (SLA) of 99.9% availability and is designed for 99.999999999% (11 9's) durability, replicating your data across multiple data centers to prevent data loss.

**Cost-Effective**  
Hosting a static website on Amazon S3 is economical. You only pay for the storage you use and the data transfer out, making it a flexible and budget-friendly option. This contrasts with traditional web hosting, where you might need to over-provision resources to handle peak loads, leading to higher costs.

**Security**  
Amazon S3 supports encryption of data at rest and in transit, ensuring that your data is protected. By serving your site over HTTPS, you can prevent man-in-the-middle (MITM) attacks and ensure data integrity and privacy for your users. AWS Certificate Manager (ACM) allows you to easily provision and manage SSL/TLS certificates for your website.

**Ease of Use**  
Setting up a static website on S3 is straightforward:
1. Create an S3 bucket and enable static website hosting.
2. Upload your website files (HTML, CSS, JavaScript, etc.).
3. Configure the bucket policy to make your files publicly accessible.
4. Use Amazon Route 53 to associate your custom domain with your S3 bucket for a professional and user-friendly URL.

**Global Reach**  
Amazon S3 allows you to replicate your content across multiple regions using Cross-Region Replication, ensuring low latency and high availability for users around the globe.

By choosing Amazon S3 for hosting BryanChasko.com, you leverage the robustness, scalability, and security of AWS's infrastructure, ensuring a reliable and cost-effective solution for your static website needs.

**Note:** Originally, we included AWS Amplify but omitted it to save approximately $10 per month. AWS Amplify provides built-in CI/CD, custom domains, and SSL certificates, which can be beneficial for dynamic content and full-stack features. For static sites, S3 is more cost-effective and straightforward.

## Projected Monthly Cost 💧
- **S3 Storage and Bandwidth**: $0.023 per GB for storage, $0.09 per GB for bandwidth.
- **Route 53 Domain Management**: ~$0.50 per month.

## Steps to Fully Build BryanChasko.com 🌼

### 1. Write and Upload README.md 🌷

1.1. **Create a GitHub Repository** 🐱  
    - Log in to GitHub and create a new repository named hugo-bryanChasko-static-website. 🦊  
    - Clone the repository to your local machine:  
      
bash
      git clone https://github.com/BryanChasko/hugo-bryanChasko-static-website.git
      cd hugo-bryanChasko-static-website
  
    - Create a README.md file with the following content and save it in the repository:

### 2. Set up Git and Hugo 🌺


2.1. **Check if Git is installed**:  
    
bash
    git --version

    
2.1.1. **Install Git if not installed** (Ubuntu/WSL2):  
    
bash
    sudo apt-get update
    sudo apt-get install git


2.2. **Check if Hugo is installed**:  
    
bash
    hugo version


2.2.1. **Install Hugo if not installed** (Ubuntu/WSL2):  
    
bash
    sudo apt-get update
    sudo apt-get install hugo


### 3. Create a New Hugo Site 🌸

3.1. **Create a new Hugo site**:  
    
bash
    hugo new site bryanChaskoHugo
    cd bryanChaskoHugo
  

### 4. Add the PaperMod Theme 🌻

4.1. **Add the PaperMod theme as a submodule**:  
    
bash
    git submodule add https://github.com/adityatelange/hugo-PaperMod.git themes/PaperMod
    echo 'theme = "PaperMod"' >> hugo.toml
  

### 5. Customize Configuration 🌱

5.1. **Edit the hugo.toml file with your site information**:  
    
toml
    baseURL = "https://bryanchasko.com"
    languageCode = "en-us"
    title = "Bryan Chasko - People from the Past"
    theme = "PaperMod"
  

### 6. Create Content Structure and Initial Content 🌿
6.1. Create Content Structure:
- In your Hugo site directory, create the content structure to match the sections outlined in your front page content. This involves creating directories for blogs, services, resume, travel tips, tech tips, etc.

bash
mkdir -p content/blogs \
content/services \
content/resume \
content/travel-tips \
content/tech-tips \
content/about \
content/contact


6.2. **Populate Content Files**:  
    - For each section mentioned in your front page content, create a markdown file within the appropriate directory. For example, about.md for the About Me section, blogs/3d-graphics.md for the 3D Graphics blog section, etc. Populate these markdown files with the content provided.

bash
touch content/about.md \
content/blogs/3d-graphics.md \
content/blogs/cloud-computing.md \
content/blogs/new-england-patriots.md \
content/services.md \
content/resume.md \
content/travel-tips.md \
content/tech-tips.md \
content/contact.md


bash
content/
├── about.md
├── blogs/
│   ├── 3d-graphics.md
│   ├── cloud-computing.md
│   └── new-england-patriots.md
├── services.md
├── resume.md
├── travel-tips.md
├── tech-tips.md
└── contact.md


6.3. **Front Page Content**:  
    - Create an _index.md file in the content root or modify the theme's home page template to include the front page content. This will serve as the landing page of the website.

    
bash
    content/
    └── _index.md  # This is your front page content file


### 6.4. Populate _index.md with the provided front page content, ormatting it as per Hugo's markdown syntax.
Create an _index.md file in the content directory.
Add the following front matter and content to _index.md:

---
title: "Home"
date: 2024-01-14T07:07:07+01:00
draft: false
---
Welcome to Bryan Chasko's personal and professional homepage! Here, you'll find blogs on 3D Graphics, Cloud Computing, and the New England Patriots, along with details about the services offered, my resume, travel tips, tech tips, and how to contact me.

### 7. Run Locally 🌷

7.1. **Start the Hugo server**:  
    
bash
    hugo server -D
  

7.2. **Open a web browser and navigate to http://localhost:1313**.  

### 8. Commit and Push Code 🐱

8.1. **Initialize the Git repository and push your changes**:  
    
bash
    git init
    git add .
    git commit -m "initial commit"
    git remote add origin https://github.com/BryanChasko/hugo-bryanChasko-static-website.git
    git push -u origin main
  

    #WE ARE HERE

8.2 **Add professional styling and initial content**
8.2.1 **Design System Definition**
Navigation Structure:

Top Navigation Bar: Fixed at the top, contains links to main sections.
Footer Bar: Fixed at the bottom, contains secondary links and social media icons.
No Sidebars: Focus on a clean, clutter-free main content area.
Responsive Design:

Ensure the website is fully responsive and works well on both desktop and mobile devices.
Use CSS media queries to adapt the layout to different screen sizes.
Color Scheme:

Primary Background: #FFFFFF (White)
Primary Text: #333333 (Dark Gray)
Accent Color: #6200EE (Purple)
Secondary Accent: #03DAC5 (Teal)
Typography:

Font Family: 'Roboto', sans-serif
Headings: Bold, varying sizes
Body Text: Regular, 16px
Links: Underlined, accent color (#6200EE)
Accessibility:

Ensure color contrast meets accessibility standards.
Provide high-contrast mode and accessible navigation.

Move on from design decisions quickly when possible by defering to apple developer guidelines. 
https://developer.apple.com/design/human-interface-guidelines

8.2.2 **Design System IN action**
 8.2.2.1Define the New Color Scheme in static/css/custom.css
 8.2.2.2 Update Layouts  layouts/_default/baseof.html:
 8.2.2.3 Create a header layouts/partials/header.html:
 8.2.2.4 Create a footer  layouts/partials/footer.html:
 note we are not utilizing side menus to maximize accessibility.

 8.2.3 **Add interactive components with Go Templates**
 Create Custom Shortcode for Forms (layouts/shortcodes/form-contact.html):
 <form action="https://formspree.io/f/{your-form-id}" method="POST">
  <label for="name">Name:</label>
  <input type="text" id="name" name="name" required>

  <label for="email">Email:</label>
  <input type="email" id="email" name="email" required>

  <label for="message">Message:</label>
  <textarea id="message" name="message" required></textarea>

  <button type="submit">Send</button>
</form>

8.2.4 **Test for Accessibility**
Use Tools Like Lighthouse or WAVE:

8.2.4.1 **Lighthouse**: Use Chrome DevTools to run Lighthouse and get a report on performance, accessibility, best practices, and SEO.

8.2.4.2 **WAVE**: Use the WAVE Browser Extension to evaluate the accessibility of your site.

### 9. Configure and Deploy to Amazon S3 🌿

see README_HOSTING.MD

### 10. Set Up Custom Domain 🦊

see README_HOSTING.MD

10.4. **In Route 53, create an alias record pointing to your S3 website endpoint**.


### Future Project Goals:
Custom Hugo Shortcodes: Create custom Hugo shortcodes in Go. These are reusable pieces of content that can be inserted into your Markdown files. For example, a shortcode that fetches and displays the latest posts from a specific category.

Data Processing Scripts: Write Go scripts to process data before it's used by Hugo. This could involve data transformation, fetching data from APIs, or generating content that can be consumed by Hugo.

Custom Output Formats: Utilize Hugo's support for custom output formats to generate additional types of content from your existing content, such as JSON feeds, using Go templates.

Theme Components with Go: If you're creating or modifying a theme, consider adding Go template logic to enhance its functionality. This could involve complex layouts or integrating dynamic data into static pages.

Automate Hugo Tasks: Develop Go programs to automate tasks related to your Hugo project, such as deployment scripts, content validation, or image optimization.

Extend Hugo: Contribute to Hugo itself or create plugins/extensions if you find functionality that could benefit the wider Hugo community.