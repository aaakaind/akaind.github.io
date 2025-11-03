# Incident Response Runbook

## Overview

This runbook provides step-by-step procedures for responding to platform incidents, from detection through resolution and post-mortem.

## Severity Levels

### P0 - Critical
**Impact:** Complete service outage, data loss, or security breach
**Response Time:** Immediate (< 5 minutes)
**Examples:**
- All services down
- Database compromised
- Active security breach
- Data corruption

### P1 - High
**Impact:** Major feature unavailable, significant performance degradation
**Response Time:** < 15 minutes
**Examples:**
- API gateway down
- Authentication service offline
- Payment processing failed
- Memory leak causing crashes

### P2 - Medium
**Impact:** Feature degradation, moderate performance issues
**Response Time:** < 1 hour
**Examples:**
- Increased error rate (1-5%)
- Slow API responses
- Cache miss rate spike
- Non-critical service down

### P3 - Low
**Impact:** Minor issues, cosmetic problems
**Response Time:** < 4 hours
**Examples:**
- UI rendering glitch
- Non-critical metric anomaly
- Documentation errors

## Incident Response Process

### 1. Detection & Alert

**Monitoring Channels:**
- PagerDuty alerts
- Grafana dashboards
- Customer support tickets
- Social media monitoring
- Error tracking (Sentry)

**Initial Assessment:**
```bash
# Check overall system health
curl -f https://www.akaind.ca/health
curl -f https://console.akaind.ca/health
curl -f https://api.akaind.ca/health

# Check monitoring dashboards
# 1. Open Grafana: https://grafana.akaind.ca
# 2. Check "Platform Overview" dashboard
# 3. Look for red indicators
```

### 2. Declare Incident

**For P0/P1 Incidents:**

1. **Page on-call engineer:**
   ```bash
   # PagerDuty CLI
   pd incident create \
     --title "P0: Marketing site down" \
     --service "akaind-platform" \
     --urgency high
   ```

2. **Create incident channel:**
   - Slack: Create channel `#incident-YYYYMMDD-HHmm`
   - Invite: on-call, leads, relevant team members
   - Pin incident template to channel

3. **Update status page:**
   ```bash
   # StatusPage API
   curl -X POST https://api.statuspage.io/v1/pages/PAGE_ID/incidents \
     -H "Authorization: OAuth TOKEN" \
     -d "incident[name]=Service Degradation" \
     -d "incident[status]=investigating" \
     -d "incident[impact]=major"
   ```

### 3. Investigate

**Incident Commander Checklist:**
- [ ] Assign roles (Commander, Scribe, SMEs)
- [ ] Establish communication cadence (updates every 15 min)
- [ ] Begin timeline documentation
- [ ] Start screen sharing session

**Investigation Steps:**

```bash
# 1. Check recent deployments
kubectl rollout history deployment/marketing -n akaind-platform

# 2. Check pod status
kubectl get pods -n akaind-platform
kubectl describe pod <failing-pod> -n akaind-platform

# 3. Check logs
kubectl logs -f deployment/marketing -n akaind-platform --tail=100

# 4. Check metrics
# - CPU usage
# - Memory usage
# - Error rate
# - Response time

# 5. Check database
kubectl exec -it deploy/postgres -n akaind-platform -- \
  psql -U akaind -c "SELECT count(*) FROM pg_stat_activity;"

# 6. Check external dependencies
curl -I https://api.stripe.com/v1/health
curl -I https://api.sendgrid.com/v3/health
```

**Common Issues & Quick Checks:**

| Symptom | Quick Check | Command |
|---------|-------------|---------|
| 5xx errors | Application logs | `kubectl logs <pod>` |
| Slow responses | Database queries | `pg_stat_statements` |
| High CPU | Running processes | `kubectl top pods` |
| High memory | Memory leaks | Heap dump analysis |
| Connection errors | Network connectivity | `curl`, `ping`, `nc` |

### 4. Mitigate

**Immediate Actions (Stopgap Solutions):**

**If Recent Deployment:**
```bash
# Rollback to previous version
kubectl rollout undo deployment/marketing -n akaind-platform

# Verify rollback
kubectl rollout status deployment/marketing -n akaind-platform
```

**If High Traffic:**
```bash
# Scale up pods
kubectl scale deployment/marketing --replicas=10 -n akaind-platform

# Enable rate limiting
kubectl apply -f k8s/rate-limit-strict.yaml
```

**If Database Issues:**
```bash
# Check slow queries
kubectl exec -it deploy/postgres -n akaind-platform -- \
  psql -U akaind -c "SELECT pid, now() - pg_stat_activity.query_start AS duration, query FROM pg_stat_activity WHERE state = 'active' AND now() - pg_stat_activity.query_start > interval '1 minute';"

# Kill long-running queries
kubectl exec -it deploy/postgres -n akaind-platform -- \
  psql -U akaind -c "SELECT pg_terminate_backend(pid) FROM pg_stat_activity WHERE pid = <PID>;"

# Restart database (last resort)
kubectl rollout restart statefulset/postgres -n akaind-platform
```

**If Memory Leak:**
```bash
# Restart affected pods
kubectl delete pod <pod-name> -n akaind-platform

# Enable heap profiling for next occurrence
kubectl set env deployment/marketing NODE_OPTIONS="--max-old-space-size=4096 --heap-prof" -n akaind-platform
```

**If External Service Down:**
```bash
# Enable circuit breaker
kubectl apply -f k8s/circuit-breaker.yaml

# Switch to backup provider
kubectl set env deployment/marketing PAYMENT_PROVIDER=backup -n akaind-platform
```

### 5. Communicate

**Internal Communication:**

Every 15 minutes in incident channel:
```
📊 Incident Update #X (HH:MM)
Status: [Investigating / Identified / Monitoring / Resolved]
Impact: X users affected, Y services degraded
Actions: Currently doing Z
ETA: Next update in 15 minutes or when status changes
```

**External Communication (Status Page):**

```markdown
**Investigating** (HH:MM UTC)
We are investigating elevated error rates on our platform. Some users may experience service degradation. We'll provide an update in 15 minutes.

**Identified** (HH:MM UTC)  
We have identified the issue as [brief technical description]. We are implementing a fix. 

**Monitoring** (HH:MM UTC)
A fix has been implemented. We are monitoring the situation to ensure stability.

**Resolved** (HH:MM UTC)
The issue has been resolved. All services are operating normally. We will conduct a post-mortem to prevent future occurrences.
```

**Customer Communication Template:**

```
Subject: [Action Required/FYI] Service Interruption - [Date]

Dear Customers,

We experienced a service interruption on [DATE] from [TIME] to [TIME] UTC affecting [SERVICES].

Impact:
- [Specific impact on users]

Root Cause:
- [Brief technical explanation]

Resolution:
- [What was done to fix]

Prevention:
- [Steps being taken to prevent recurrence]

We apologize for any inconvenience. If you have questions, please contact support@akaind.ca.

Best regards,
AKA Industries Team
```

### 6. Resolve

**Resolution Checklist:**
- [ ] Root cause identified
- [ ] Permanent fix implemented
- [ ] Tests passing
- [ ] Metrics returned to normal
- [ ] No alerts firing
- [ ] Monitored for 30+ minutes
- [ ] Status page updated to "Resolved"
- [ ] Customers notified (if applicable)

**Verification Steps:**
```bash
# 1. Verify service health
for service in marketing console developer-hub partner-portal; do
  echo "Checking $service..."
  curl -f https://$service.akaind.ca/health || echo "FAILED: $service"
done

# 2. Check error rates
# Should be < 0.1%

# 3. Check response times
# P95 should be < 200ms

# 4. Run smoke tests
npm run test:smoke -- --env=production

# 5. Check metrics dashboard
# All green in Grafana
```

### 7. Post-Incident

**Immediate Actions:**
- [ ] Close incident in PagerDuty
- [ ] Update status page to "Resolved"
- [ ] Archive incident Slack channel
- [ ] Schedule post-mortem meeting (within 48 hours)
- [ ] Thank responders

**Post-Mortem Meeting:**

**Attendees:**
- Incident Commander
- On-call engineers
- Product/Engineering leads
- Anyone who participated

**Agenda:**
1. **Timeline Review** (10 min)
   - When did it start?
   - When was it detected?
   - What actions were taken?
   - When was it resolved?

2. **Root Cause Analysis** (20 min)
   - What happened?
   - Why did it happen?
   - 5 Whys analysis

3. **Impact Assessment** (10 min)
   - Users affected
   - Revenue impact
   - Reputation damage

4. **What Went Well** (10 min)
   - Good practices
   - Effective tools
   - Team coordination

5. **What Could Be Improved** (20 min)
   - Gaps in monitoring
   - Process improvements
   - Tool enhancements

6. **Action Items** (10 min)
   - Assign owners
   - Set deadlines
   - Prioritize

**Post-Mortem Document Template:**

```markdown
# Post-Mortem: [Incident Title]

## Summary
[2-3 sentence summary of incident]

## Impact
- **Duration:** X hours Y minutes
- **Users Affected:** N users
- **Services Impacted:** List
- **Revenue Impact:** $X (estimated)

## Timeline
- HH:MM - Incident began
- HH:MM - First alert
- HH:MM - Incident declared
- HH:MM - Mitigation started
- HH:MM - Service restored
- HH:MM - Incident resolved

## Root Cause
[Detailed technical explanation]

### Contributing Factors
- Factor 1
- Factor 2

## Resolution
[What was done to fix the issue]

## What Went Well
- ✅ Fast detection
- ✅ Clear communication
- ✅ Effective rollback

## What Didn't Go Well
- ❌ Lack of monitoring
- ❌ Unclear runbook
- ❌ Delayed escalation

## Action Items
| Action | Owner | Due Date | Status |
|--------|-------|----------|--------|
| Add monitoring for X | @alice | 2024-01-15 | 🟡 In Progress |
| Update runbook | @bob | 2024-01-10 | ✅ Done |
| Implement circuit breaker | @charlie | 2024-01-20 | 📋 Todo |

## Lessons Learned
1. Always have monitoring for critical paths
2. Document recovery procedures
3. Test failover regularly
```

## Common Incidents

### Marketing Site Down

**Symptoms:** 5xx errors, timeout, can't reach site

**Quick Diagnosis:**
```bash
# Check deployment
kubectl get pods -n akaind-platform | grep marketing

# Check recent changes
git log --oneline --since="1 hour ago"

# Check external dependencies
curl -I https://cdn.akaind.ca
```

**Resolution:**
1. Rollback if recent deployment
2. Scale up if traffic spike
3. Check CDN if timing out
4. Restart pods if crash loop

### Database Connection Exhausted

**Symptoms:** "Too many connections" errors

**Quick Diagnosis:**
```bash
# Check active connections
kubectl exec -it deploy/postgres -n akaind-platform -- \
  psql -U akaind -c "SELECT count(*) FROM pg_stat_activity;"

# Check connection pool settings
```

**Resolution:**
1. Kill idle connections
2. Increase max_connections temporarily
3. Fix connection leaks in application
4. Implement connection pooling

### Redis Down

**Symptoms:** Cache misses, slow performance

**Quick Diagnosis:**
```bash
# Check Redis health
kubectl exec -it deploy/redis -n akaind-platform -- redis-cli ping

# Check memory usage
kubectl exec -it deploy/redis -n akaind-platform -- redis-cli info memory
```

**Resolution:**
1. Restart Redis if unresponsive
2. Increase memory if OOM
3. Clear cache if corrupted
4. Failover to replica if available

### API Rate Limit Exceeded

**Symptoms:** 429 errors, legitimate traffic blocked

**Quick Diagnosis:**
```bash
# Check rate limit rules
kubectl describe ingress -n akaind-platform

# Check recent traffic patterns
```

**Resolution:**
1. Temporarily increase limits
2. Whitelist legitimate IPs
3. Implement gradual rate limits
4. Add caching layer

## Tools & Resources

### Monitoring Dashboards
- **Grafana:** https://grafana.akaind.ca
- **Jaeger:** https://jaeger.akaind.ca
- **Kibana:** https://kibana.akaind.ca

### Runbooks
- [Deployment](./DEPLOYMENT.md)
- [Database Maintenance](./DATABASE.md)
- [Security Incident](./SECURITY_INCIDENT.md)

### Contacts
- **On-Call:** PagerDuty rotation
- **Slack:** #incidents
- **Email:** incidents@akaind.ca

### External Resources
- [Kubernetes Troubleshooting](https://kubernetes.io/docs/tasks/debug/)
- [PostgreSQL Troubleshooting](https://wiki.postgresql.org/wiki/Troubleshooting)
- [AWS Status](https://status.aws.amazon.com/)

## Appendix

### Useful Commands

```bash
# Get pod logs
kubectl logs -f <pod-name> -n akaind-platform

# Exec into pod
kubectl exec -it <pod-name> -n akaind-platform -- /bin/bash

# Port forward for debugging
kubectl port-forward svc/postgres 5432:5432 -n akaind-platform

# Get events
kubectl get events -n akaind-platform --sort-by='.lastTimestamp'

# Describe resource
kubectl describe <resource-type> <resource-name> -n akaind-platform

# Check resource usage
kubectl top pods -n akaind-platform
kubectl top nodes
```

### Emergency Contacts

| Role | Contact | Phone |
|------|---------|-------|
| On-Call Engineer | PagerDuty | Auto-dial |
| Engineering Lead | Slack @eng-lead | XXX-XXX-XXXX |
| DevOps Lead | Slack @devops-lead | XXX-XXX-XXXX |
| CTO | Slack @cto | XXX-XXX-XXXX |
| AWS Support | AWS Console | XXX-XXX-XXXX |

---

**Last Updated:** November 2024
**Next Review:** February 2025
