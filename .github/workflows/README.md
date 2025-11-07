# GitHub Actions Deployment to GCP

This workflow automatically builds your Docker image, pushes it to Docker Hub, and deploys it to your GCP server via SSH.

## Workflow Triggers

- **Automatic**: Triggers on push to `main` branch
- **Manual**: Can be triggered manually via GitHub Actions UI

## Prerequisites

### 1. Docker Hub Account
- Create an account at [Docker Hub](https://hub.docker.com)
- Create an access token: Account Settings → Security → New Access Token

### 2. GCP Server Setup
- A GCP VM instance with:
  - Docker installed
  - Docker Compose installed
  - SSH access enabled
  - Git installed (for pulling docker-compose.yaml updates)

### 3. GitHub Repository Secrets

Go to your repository → Settings → Secrets and variables → Actions → New repository secret

Add the following secrets:

#### Docker Hub Secrets
- `DOCKERHUB_USERNAME`: Your Docker Hub username
- `DOCKERHUB_TOKEN`: Your Docker Hub access token

#### GCP Server Secrets
- `GCP_HOST`: Your GCP server IP address or hostname (e.g., `34.123.45.67`)
- `GCP_USERNAME`: SSH username (e.g., `ubuntu`, `admin`, or your username)
- `GCP_SSH_PRIVATE_KEY`: Your SSH private key (entire content of `~/.ssh/id_rsa`)
- `GCP_SSH_PORT`: (Optional) SSH port, defaults to `22`
- `GCP_APP_DIR`: (Optional) Application directory on server, defaults to `~/ventidole-core`

## Setting Up SSH Access

### Generate SSH Key Pair (if you don't have one)

```bash
ssh-keygen -t rsa -b 4096 -C "github-actions@ventidole-core"
```

### Add Public Key to GCP Server

```bash
# Copy your public key
cat ~/.ssh/id_rsa.pub

# SSH into your GCP server
ssh username@your-gcp-ip

# Add the public key to authorized_keys
echo "your-public-key-here" >> ~/.ssh/authorized_keys
chmod 600 ~/.ssh/authorized_keys
```

### Add Private Key to GitHub Secrets

```bash
# Copy the entire private key content
cat ~/.ssh/id_rsa

# Add this as GCP_SSH_PRIVATE_KEY secret in GitHub
```

## GCP Server Initial Setup

SSH into your GCP server and run:

```bash
# Install Docker
curl -fsSL https://get.docker.com -o get-docker.sh
sudo sh get-docker.sh
sudo usermod -aG docker $USER

# Install Docker Compose
sudo curl -L "https://github.com/docker/compose/releases/latest/download/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
sudo chmod +x /usr/local/bin/docker-compose

# Install Git
sudo apt-get update
sudo apt-get install -y git

# Clone your repository
cd ~
git clone https://github.com/TrTueTah/ventidole-core.git
cd ventidole-core

# Create .env file with your configuration
nano .env
```

### Required Environment Variables in `.env`

Create a `.env` file on your GCP server with:

```env
PROJECT=ventidole
PORT=3000
REDIS_PORT=6379

# Database configuration
DATABASE_URL="your-database-url"

# Add all other required environment variables
```

## Workflow Steps

1. **Build and Push Job**:
   - Checks out code
   - Sets up Docker Buildx
   - Logs in to Docker Hub
   - Builds Docker image using `docker/prod/Dockerfile`
   - Pushes image with two tags: `latest` and commit SHA
   - Uses GitHub Actions cache for faster builds

2. **Deploy Job**:
   - Connects to GCP server via SSH
   - Navigates to application directory
   - Pulls latest code (for docker-compose.yaml updates)
   - Logs in to Docker Hub on the server
   - Pulls the latest Docker image
   - Stops old containers
   - Starts new containers with updated image
   - Cleans up old Docker images
   - Shows deployment status and logs

## Manual Deployment

You can trigger deployment manually:

1. Go to your GitHub repository
2. Click on "Actions" tab
3. Select "Deploy to GCP" workflow
4. Click "Run workflow"
5. Select the branch and click "Run workflow"

## Monitoring Deployment

### Check Workflow Status
- Go to Actions tab in your repository
- Click on the latest workflow run
- View logs for each step

### Check Server Status

SSH into your server and run:

```bash
cd ~/ventidole-core

# Check running containers
docker-compose -f docker/prod/docker-compose.yaml ps

# View logs
docker-compose -f docker/prod/docker-compose.yaml logs -f

# Check specific service logs
docker-compose -f docker/prod/docker-compose.yaml logs -f server
```

## Troubleshooting

### Deployment fails at SSH step
- Verify `GCP_HOST` and `GCP_USERNAME` are correct
- Verify SSH private key is complete (including `-----BEGIN` and `-----END` lines)
- Check SSH port is correct (default: 22)
- Ensure firewall allows SSH connections

### Docker pull fails on server
- Verify Docker Hub credentials are correct
- Check server has internet access
- Ensure enough disk space: `df -h`

### Container fails to start
- Check environment variables in `.env` file
- Verify database connection
- Check logs: `docker-compose -f docker/prod/docker-compose.yaml logs server`

### Port conflicts
- Ensure ports 80, 443, 3000, 6379 are available
- Check with: `sudo netstat -tulpn | grep LISTEN`

## Security Best Practices

1. **Use SSH keys instead of passwords**
2. **Rotate Docker Hub tokens regularly**
3. **Limit SSH access** (use firewall rules)
4. **Use secrets for sensitive data** (never commit to repository)
5. **Enable 2FA on Docker Hub and GitHub**
6. **Regularly update Docker images and server packages**

## Rollback

If deployment fails, SSH into server and rollback:

```bash
cd ~/ventidole-core

# Pull previous working image (using commit SHA)
docker pull your-dockerhub-username/ventidole-core:previous-commit-sha

# Update docker-compose.yaml to use specific tag, then restart
docker-compose -f docker/prod/docker-compose.yaml down
docker-compose -f docker/prod/docker-compose.yaml up -d
```

## Cost Optimization

- GitHub Actions: 2,000 free minutes/month for private repos
- Docker Hub: Unlimited public repositories, rate limits apply
- Consider using GitHub Container Registry as alternative

## Next Steps

1. ✅ Set up all required GitHub secrets
2. ✅ Configure GCP server with Docker and dependencies
3. ✅ Create `.env` file on server
4. ✅ Test SSH connection from local machine
5. ✅ Push to main branch or trigger manual deployment
6. Monitor first deployment and check logs

---

For issues or questions, please create an issue in this repository.
