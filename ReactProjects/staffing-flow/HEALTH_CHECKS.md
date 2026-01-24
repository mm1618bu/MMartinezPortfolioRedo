# Health Check Endpoints

This document describes the health check and readiness endpoints available in the Staffing Flow API.

## Overview

The API provides multiple health check endpoints designed for different monitoring purposes, including container orchestration (Kubernetes), load balancers, and application monitoring.

All health check endpoints:
- Are **not rate limited** - they can be called frequently without hitting rate limits
- Are **not logged** - they don't clutter logs with frequent health check requests
- Return **JSON responses** with detailed status information
- Include **timestamps** and **uptime** information

## Endpoints

### 1. Liveness Probe

**Endpoints:**
- `GET /api/health`
- `GET /api/live`
- `GET /api/liveness`

**Purpose:** Checks if the application process is running. Used by Kubernetes liveness probes to know when to restart the container.

**Success Response:** `200 OK`
```json
{
  "status": "healthy",
  "timestamp": "2026-01-24T18:18:46.661Z",
  "uptime": 11.168238311,
  "environment": "development",
  "version": "0.0.0"
}
```

**Failure Response:** This endpoint should always return 200 if the process is alive. If it doesn't respond, the process is likely dead.

**Use Cases:**
- Kubernetes liveness probe configuration
- Basic uptime monitoring
- Process health checks

---

### 2. Readiness Probe

**Endpoints:**
- `GET /api/ready`
- `GET /api/readiness`

**Purpose:** Checks if the application is ready to accept traffic. Validates critical dependencies like database connectivity and environment configuration.

**Success Response:** `200 OK`
```json
{
  "status": "healthy",
  "timestamp": "2026-01-24T18:19:17.006Z",
  "uptime": 41.51289497,
  "environment": "development",
  "version": "0.0.0",
  "checks": {
    "database": {
      "status": "pass",
      "message": "Database connection successful",
      "responseTime": 45
    },
    "environment": {
      "status": "pass",
      "message": "All required environment variables present"
    },
    "memory": {
      "status": "pass",
      "message": "Memory usage: 75.23%"
    }
  }
}
```

**Failure Response:** `503 Service Unavailable`
```json
{
  "status": "unhealthy",
  "timestamp": "2026-01-24T18:19:17.006Z",
  "uptime": 41.51289497,
  "environment": "development",
  "version": "0.0.0",
  "checks": {
    "database": {
      "status": "fail",
      "message": "Database connection failed: timeout",
      "responseTime": 5000
    },
    "environment": {
      "status": "pass",
      "message": "All required environment variables present"
    },
    "memory": {
      "status": "fail",
      "message": "High memory usage: 92.13%"
    }
  }
}
```

**Checks Performed:**
1. **Database connectivity** - Queries Supabase to ensure database is reachable
2. **Environment variables** - Validates all required env vars are present
3. **Memory usage** - Warns if heap usage exceeds 90%

**Use Cases:**
- Kubernetes readiness probe configuration
- Load balancer health checks
- Traffic routing decisions
- Deployment validation

---

### 3. Startup Probe

**Endpoint:**
- `GET /api/startup`

**Purpose:** Checks if the application has finished starting up. Used by Kubernetes startup probes to know when the container is ready to receive liveness/readiness probes.

**Response:** Same format as readiness probe (currently uses same implementation)

**Use Cases:**
- Kubernetes startup probe configuration (for slow-starting applications)
- Initial deployment validation

---

### 4. Detailed Health Check

**Endpoint:**
- `GET /api/health/detailed`

**Purpose:** Comprehensive health check with extensive diagnostics. **Should not be exposed publicly** - use for internal monitoring and debugging only.

**Success Response:** `200 OK`
```json
{
  "status": "healthy",
  "timestamp": "2026-01-24T18:19:28.778Z",
  "uptime": 53.285051002,
  "environment": "development",
  "version": "0.0.0",
  "checks": {
    "database": {
      "status": "pass",
      "message": "Database connection successful",
      "responseTime": 87
    },
    "environment": {
      "status": "pass",
      "message": "All required environment variables present"
    },
    "memory": {
      "status": "pass",
      "message": "Heap: 22.66MB / 24.60MB (92.13%), RSS: 112.75MB"
    },
    "cpu": {
      "status": "pass",
      "message": "User: 1.30s, System: 0.16s"
    },
    "eventLoop": {
      "status": "pass",
      "message": "Event loop lag: 0ms",
      "responseTime": 0
    }
  }
}
```

**Failure Response:** `503 Service Unavailable` (with detailed failure information)

**Checks Performed:**
1. **Database connectivity** - Full database connection test
2. **Environment variables** - All required variables validated
3. **Memory usage** - Detailed heap and RSS memory statistics
4. **CPU usage** - Process CPU time (user + system)
5. **Event loop lag** - Node.js event loop responsiveness (warns if > 100ms)

**Use Cases:**
- Internal monitoring dashboards
- Troubleshooting and debugging
- Performance analysis
- DevOps tooling

---

## Kubernetes Configuration Examples

### Liveness Probe
```yaml
livenessProbe:
  httpGet:
    path: /api/health
    port: 3001
  initialDelaySeconds: 30
  periodSeconds: 10
  timeoutSeconds: 5
  failureThreshold: 3
```

### Readiness Probe
```yaml
readinessProbe:
  httpGet:
    path: /api/ready
    port: 3001
  initialDelaySeconds: 10
  periodSeconds: 5
  timeoutSeconds: 3
  failureThreshold: 3
  successThreshold: 1
```

### Startup Probe (for slow-starting apps)
```yaml
startupProbe:
  httpGet:
    path: /api/startup
    port: 3001
  initialDelaySeconds: 0
  periodSeconds: 5
  timeoutSeconds: 3
  failureThreshold: 30  # 150 seconds max startup time
```

---

## Load Balancer Configuration Examples

### AWS Application Load Balancer (ALB)
```yaml
Health check protocol: HTTP
Health check path: /api/ready
Health check port: traffic port
Healthy threshold: 2
Unhealthy threshold: 3
Timeout: 5 seconds
Interval: 30 seconds
Success codes: 200
```

### Google Cloud Load Balancer
```yaml
Health check:
  Protocol: HTTP
  Port: 3001
  Request path: /api/ready
  Check interval: 10 seconds
  Timeout: 5 seconds
  Healthy threshold: 2
  Unhealthy threshold: 3
```

### NGINX Upstream Health Check
```nginx
upstream api_backend {
    server api1.example.com:3001;
    server api2.example.com:3001;
    
    # Health check configuration
    check interval=5000 rise=2 fall=3 timeout=3000 type=http;
    check_http_send "GET /api/ready HTTP/1.0\r\n\r\n";
    check_http_expect_alive http_2xx http_3xx;
}
```

---

## Monitoring Best Practices

### 1. Use Appropriate Endpoints

- **Liveness probes** → `/api/health` (simple, fast, always returns 200 if process alive)
- **Readiness probes** → `/api/ready` (validates dependencies before routing traffic)
- **Internal monitoring** → `/api/health/detailed` (comprehensive diagnostics)

### 2. Configure Appropriate Timeouts

- Liveness: 5-10 seconds
- Readiness: 3-5 seconds
- Startup: 3-5 seconds (but allow more retries)

### 3. Set Reasonable Thresholds

- **Failure threshold**: 2-3 consecutive failures before marking unhealthy
- **Success threshold**: 1-2 consecutive successes before marking healthy
- **Check interval**: 5-30 seconds depending on criticality

### 4. Monitor Health Check Performance

Track these metrics:
- Health check response times
- Failure rates
- Database connection times
- Memory usage trends
- Event loop lag

### 5. Alert on Health Check Failures

Set up alerts for:
- Readiness probe failures (traffic routing issues)
- Database connectivity failures
- High memory usage (>90%)
- Event loop lag (>100ms sustained)
- Liveness probe failures (process crashes)

---

## Security Considerations

### 1. Rate Limiting
All health check endpoints are **excluded from rate limiting** to ensure monitoring systems can check frequently without being blocked.

### 2. Authentication
Health check endpoints are **unauthenticated** by design - they need to be accessible to load balancers and orchestration systems. 

**Important:** The `/api/health/detailed` endpoint exposes detailed system information and should:
- Only be accessible from internal networks
- Use firewall rules or API gateway policies to restrict access
- Never be exposed to the public internet

### 3. Information Disclosure
Health check responses include:
- ✅ Environment name (development/production)
- ✅ Application version
- ✅ Uptime
- ❌ Internal IP addresses
- ❌ Database credentials
- ❌ Sensitive configuration

---

## Troubleshooting

### Health Endpoint Returns 503

**Check:**
1. Database connectivity - Can the app reach Supabase?
2. Environment variables - Are all required variables set?
3. Memory usage - Is the application running out of memory?
4. Application logs - Check Winston logs for errors

**Common Causes:**
- Supabase URL misconfigured
- Network connectivity issues
- RLS policies preventing database queries
- Memory leaks causing high heap usage

### Health Endpoint Not Responding

**Check:**
1. Server process - Is the Node.js process running?
2. Port binding - Is port 3001 listening?
3. Firewall - Are requests reaching the server?
4. DNS resolution - Can clients resolve the hostname?

**Debug Commands:**
```bash
# Check if server is listening
lsof -ti:3001

# Test from server itself
curl http://localhost:3001/api/health

# Check server logs
tail -f logs/combined.log

# Test DNS and connectivity
dig api.example.com
curl -v http://api.example.com/api/health
```

### High Memory Usage Warnings

**Actions:**
1. Restart the application (temporary fix)
2. Investigate memory leaks with heap snapshots
3. Check for retained references or event listener leaks
4. Consider increasing container memory limits
5. Implement memory profiling in development

---

## Example Monitoring Scripts

### Simple Shell Script
```bash
#!/bin/bash
# simple-health-check.sh

ENDPOINT="http://localhost:3001/api/ready"
RESPONSE=$(curl -s -o /dev/null -w "%{http_code}" $ENDPOINT)

if [ "$RESPONSE" = "200" ]; then
    echo "✓ API is healthy"
    exit 0
else
    echo "✗ API is unhealthy (HTTP $RESPONSE)"
    exit 1
fi
```

### Detailed Monitoring Script
```bash
#!/bin/bash
# detailed-health-monitoring.sh

API_URL="http://localhost:3001"

echo "=== API Health Check Report ==="
echo "Time: $(date)"
echo ""

# Liveness
echo "1. Liveness Probe:"
curl -s "$API_URL/api/health" | jq -r '.status, .uptime' | xargs printf "   Status: %s, Uptime: %.2fs\n"
echo ""

# Readiness
echo "2. Readiness Probe:"
READY_STATUS=$(curl -s "$API_URL/api/ready" | jq -r '.status')
echo "   Status: $READY_STATUS"

if [ "$READY_STATUS" = "unhealthy" ]; then
    echo "   Failed Checks:"
    curl -s "$API_URL/api/ready" | jq -r '.checks | to_entries[] | select(.value.status == "fail") | "   - \(.key): \(.value.message)"'
fi
echo ""

# Detailed (if accessible)
echo "3. System Metrics:"
curl -s "$API_URL/api/health/detailed" | jq -r '.checks.memory.message, .checks.cpu.message, .checks.eventLoop.message' | sed 's/^/   /'
```

---

## References

- [Kubernetes Liveness, Readiness and Startup Probes](https://kubernetes.io/docs/tasks/configure-pod-container/configure-liveness-readiness-startup-probes/)
- [AWS Application Load Balancer Health Checks](https://docs.aws.amazon.com/elasticloadbalancing/latest/application/target-group-health-checks.html)
- [Google Cloud Load Balancing Health Checks](https://cloud.google.com/load-balancing/docs/health-checks)
