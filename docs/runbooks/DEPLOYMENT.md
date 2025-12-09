# Deployment Runbook

## Overview

This runbook covers deployment procedures for the AKA Industries platform, including canary deployments, rollbacks, and emergency procedures.

## Branch and Environment Mapping

We follow a Git Flow-inspired branching strategy. For complete details, see [Branching Strategy](../BRANCHING_STRATEGY.md).

| Branch | Environment | Deployment | URL |
|--------|-------------|------------|-----|
| `develop` | Staging/Development | Automatic on merge | https://staging.akaind.ca |
| `main` | Production | Automatic with canary | https://www.akaind.ca |

**Key Points:**
- All development work is done in feature/upgrade branches from `develop`
- Merges to `develop` trigger automatic deployment to staging
- Merges to `main` trigger canary deployment to production
- Hotfixes branch from `main` for critical production fixes

## Prerequisites

- AWS CLI configured with appropriate credentials
- kubectl configured for EKS cluster access
- Terraform installed (>= 1.5.0)
- Docker installed and authenticated to container registry
- Access to monitoring dashboards (Grafana, DataDog, etc.)

## Deployment Checklist

### Pre-Deployment

- [ ] Verify all CI/CD tests pass
- [ ] Review changed files and pull request
- [ ] Check database migrations are ready
- [ ] Verify environment variables are up to date
- [ ] Check current system health and metrics
- [ ] Notify team in #deployments Slack channel
- [ ] Create deployment ticket/tracking issue
- [ ] Review rollback plan

### Deployment Steps

#### 1. Canary Deployment to Staging

**Note:** Staging deploys automatically from the `develop` branch. See [Branching Strategy](../BRANCHING_STRATEGY.md) for details.

```bash
# Deploy to staging environment (if manual deployment needed)
git checkout develop
git pull origin develop

# Build and push Docker images
npm run docker:build
docker tag akaind/marketing:latest akaind/marketing:staging-$(git rev-parse --short HEAD)
docker push akaind/marketing:staging-$(git rev-parse --short HEAD)

# Update staging deployment
kubectl set image deployment/marketing \
  marketing=akaind/marketing:staging-$(git rev-parse --short HEAD) \
  -n akaind-staging

# Wait for rollout
kubectl rollout status deployment/marketing -n akaind-staging --timeout=5m
```

#### 2. Smoke Tests on Staging

```bash
# Run automated smoke tests
npm run test:smoke -- --env=staging

# Manual verification checklist:
# - [ ] Homepage loads correctly
# - [ ] User can login
# - [ ] API endpoints respond
# - [ ] Database connectivity works
# - [ ] Redis cache is accessible
# - [ ] Metrics are being collected
```

#### 3. Canary Deployment to Production

```bash
# Deploy to 10% of production traffic
kubectl apply -f k8s/canary-deployment.yaml

# Monitor canary metrics for 15 minutes
watch -n 10 'kubectl get canary marketing -n akaind-platform'

# Check error rates
curl https://prometheus.akaind.ca/api/v1/query?query=rate(http_requests_total{status=~"5.."}[5m])
```

**Canary Success Criteria:**
- Error rate < 0.1%
- P95 latency < 200ms
- No increase in 5xx errors
- Memory usage within normal bounds
- CPU usage < 70%

#### 4. Progressive Rollout

If canary is healthy, gradually increase traffic:

```bash
# 25% traffic
kubectl patch canary marketing -n akaind-platform \
  --type='json' -p='[{"op": "replace", "path": "/spec/analysis/maxWeight", "value": 25}]'

# Wait 10 minutes and monitor

# 50% traffic
kubectl patch canary marketing -n akaind-platform \
  --type='json' -p='[{"op": "replace", "path": "/spec/analysis/maxWeight", "value": 50}]'

# Wait 10 minutes and monitor

# 100% traffic
kubectl patch canary marketing -n akaind-platform \
  --type='json' -p='[{"op": "replace", "path": "/spec/analysis/maxWeight", "value": 100}]'
```

#### 5. Database Migrations

If deployment includes database changes:

```bash
# Backup database first
kubectl exec -it deploy/postgres -n akaind-platform -- \
  pg_dump -U akaind platform > backup-$(date +%Y%m%d-%H%M%S).sql

# Run migrations
kubectl exec -it deploy/migration-job -n akaind-platform -- \
  npm run migrate:up

# Verify migrations
kubectl logs -f deploy/migration-job -n akaind-platform
```

#### 6. Post-Deployment Verification

```bash
# Run full test suite
npm run test:e2e -- --env=production

# Verify metrics
- Check Grafana dashboards
- Review error logs in DataDog
- Verify Jaeger traces show no anomalies
- Check SLO compliance

# Business verification
- Test critical user flows
- Verify payment processing
- Check email delivery
- Test webhook deliveries
```

### Post-Deployment

- [ ] Verify metrics return to baseline
- [ ] Check error rates in monitoring
- [ ] Review logs for any warnings
- [ ] Update deployment documentation
- [ ] Close deployment ticket
- [ ] Announce completion in Slack
- [ ] Document any issues encountered

## Rollback Procedures

### Automatic Rollback

Flagger will automatically rollback if canary analysis fails:

```yaml
# Automatic rollback triggers:
- Error rate > 1%
- P95 latency > 500ms
- Failed health checks > 5
```

### Manual Rollback

If manual rollback is needed:

```bash
# Option 1: Revert to previous deployment
kubectl rollout undo deployment/marketing -n akaind-platform

# Option 2: Roll back to specific revision
kubectl rollout history deployment/marketing -n akaind-platform
kubectl rollout undo deployment/marketing --to-revision=5 -n akaind-platform

# Verify rollback
kubectl rollout status deployment/marketing -n akaind-platform

# Option 3: Use previous Docker image
kubectl set image deployment/marketing \
  marketing=akaind/marketing:sha-previous-commit \
  -n akaind-platform
```

### Database Rollback

If database migration needs to be reverted:

```bash
# Revert one migration
kubectl exec -it deploy/migration-job -n akaind-platform -- \
  npm run migrate:down

# Or restore from backup
kubectl exec -it deploy/postgres -n akaind-platform -- \
  psql -U akaind platform < backup-YYYYMMDD-HHMMSS.sql
```

## Emergency Procedures

### High Error Rate

If error rate spikes above 5%:

1. **Immediate Actions:**
   ```bash
   # Check service health
   kubectl get pods -n akaind-platform
   kubectl describe pod <failing-pod> -n akaind-platform
   
   # Check logs
   kubectl logs -f deployment/marketing -n akaind-platform --tail=100
   
   # Rollback if issue is from recent deployment
   kubectl rollout undo deployment/marketing -n akaind-platform
   ```

2. **Investigation:**
   - Review recent changes
   - Check external service status
   - Verify database connectivity
   - Check rate limits

### Database Connection Issues

```bash
# Check PostgreSQL health
kubectl exec -it deploy/postgres -n akaind-platform -- pg_isready

# Check connection pool
kubectl exec -it deploy/postgres -n akaind-platform -- \
  psql -U akaind -c "SELECT count(*) FROM pg_stat_activity;"

# Restart PostgreSQL if needed (last resort)
kubectl rollout restart statefulset/postgres -n akaind-platform
```

### Cache Issues

```bash
# Check Redis health
kubectl exec -it deploy/redis -n akaind-platform -- redis-cli ping

# Clear cache if needed
kubectl exec -it deploy/redis -n akaind-platform -- redis-cli FLUSHALL

# Restart Redis
kubectl rollout restart deployment/redis -n akaind-platform
```

### Memory Leak

If memory usage continuously increases:

```bash
# Check pod memory usage
kubectl top pods -n akaind-platform

# Get heap dump
kubectl exec -it <pod-name> -n akaind-platform -- \
  node --expose-gc --max-old-space-size=4096 \
  -e "require('v8').writeHeapSnapshot('heap.heapsnapshot')"

# Restart affected pods
kubectl delete pod <pod-name> -n akaind-platform
```

### Traffic Spike / DDoS

```bash
# Enable rate limiting
kubectl apply -f k8s/rate-limit-strict.yaml

# Scale up if legitimate traffic
kubectl scale deployment/marketing --replicas=10 -n akaind-platform

# Check WAF rules
aws wafv2 list-web-acls --scope=CLOUDFRONT --region=us-east-1
```

## Monitoring and Alerts

### Key Metrics to Monitor

1. **Application Metrics:**
   - Request rate (requests/sec)
   - Error rate (%)
   - Response time (P50, P95, P99)
   - Success rate (%)

2. **Infrastructure Metrics:**
   - CPU usage (%)
   - Memory usage (%)
   - Disk I/O
   - Network throughput

3. **Business Metrics:**
   - Active users
   - API calls
   - Conversion rate
   - Revenue

### Alert Thresholds

```yaml
Critical Alerts (PagerDuty):
  - Error rate > 5%
  - P95 latency > 1s
  - Service down
  - Database unavailable

Warning Alerts (Slack):
  - Error rate > 1%
  - P95 latency > 500ms
  - CPU > 80%
  - Memory > 85%
  - Disk > 80%
```

## Maintenance Windows

Schedule: Every Saturday 2-4 AM EST

```bash
# Enable maintenance mode
kubectl apply -f k8s/maintenance-page.yaml

# Perform maintenance tasks
npm run maintenance:cleanup
npm run database:vacuum

# Disable maintenance mode
kubectl delete -f k8s/maintenance-page.yaml
```

## Communication

### Deployment Announcement Template

```
🚀 Deployment Starting
Environment: Production
Version: v1.2.3
ETA: 30 minutes
Changes: [Link to PR]
Rollback Plan: [Link to Runbook]
```

### Incident Communication Template

```
🚨 Incident Detected
Severity: P1
Impact: Marketing site experiencing elevated errors
Status: Investigating
ETA: 15 minutes
Updates: Every 10 minutes
```

## Post-Mortem Template

After any incident or deployment issue:

1. **What Happened:** Brief description
2. **Timeline:** Key events with timestamps
3. **Root Cause:** Technical explanation
4. **Impact:** Users affected, duration
5. **Resolution:** How it was fixed
6. **Action Items:** Prevention measures
7. **Lessons Learned:** What we learned

## Contact Information

- **On-Call Engineer:** PagerDuty rotation
- **Platform Team Lead:** Slack @platform-lead
- **DevOps Team:** #devops Slack channel
- **Incident Commander:** #incidents Slack channel

## References

- [Kubernetes Documentation](https://kubernetes.io/docs/)
- [AWS EKS Best Practices](https://aws.github.io/aws-eks-best-practices/)
- [Incident Response Guide](./INCIDENT_RESPONSE.md)
- [Architecture Overview](../ARCHITECTURE.md)
