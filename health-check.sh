#!/bin/bash

# Production Health Check Script for Stock Sentiment Analyzer
# Usage: ./health-check.sh [--verbose]

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Configuration
BACKEND_URL=${BACKEND_URL:-"http://localhost:5000"}
FRONTEND_URL=${FRONTEND_URL:-"http://localhost:3000"}
TIMEOUT=${TIMEOUT:-10}
VERBOSE=${1:-""}

# Helper functions
log_info() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

log_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

log_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

log_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Check if service is running
check_service() {
    local name=$1
    local url=$2
    local expected_status=${3:-200}
    
    log_info "Checking $name..."
    
    if [[ "$VERBOSE" == "--verbose" ]]; then
        response=$(curl -s -w "\n%{http_code}" --connect-timeout $TIMEOUT "$url" || echo "ERROR\n000")
    else
        response=$(curl -s -w "\n%{http_code}" --connect-timeout $TIMEOUT "$url" 2>/dev/null || echo "ERROR\n000")
    fi
    
    body=$(echo "$response" | head -n -1)
    status=$(echo "$response" | tail -n 1)
    
    if [[ "$status" == "$expected_status" ]]; then
        log_success "$name is healthy (HTTP $status)"
        if [[ "$VERBOSE" == "--verbose" ]]; then
            echo "Response: $body"
        fi
        return 0
    else
        log_error "$name is unhealthy (HTTP $status)"
        if [[ "$VERBOSE" == "--verbose" ]]; then
            echo "Response: $body"
        fi
        return 1
    fi
}

# Check Docker containers
check_docker() {
    log_info "Checking Docker containers..."
    
    containers=("stock-sentiment-backend" "stock-sentiment-frontend" "stock-sentiment-redis")
    
    for container in "${containers[@]}"; do
        if docker ps --format "table {{.Names}}" | grep -q "$container"; then
            status=$(docker inspect --format='{{.State.Health.Status}}' "$container" 2>/dev/null || echo "unknown")
            if [[ "$status" == "healthy" ]] || [[ "$status" == "unknown" ]]; then
                log_success "Container $container is running"
            else
                log_warning "Container $container is running but health status: $status"
            fi
        else
            log_error "Container $container is not running"
            return 1
        fi
    done
}

# Check backend API endpoints
check_backend_endpoints() {
    log_info "Checking backend API endpoints..."
    
    endpoints=(
        "/api/health"
        "/api/version"
    )
    
    for endpoint in "${endpoints[@]}"; do
        if ! check_service "Backend$endpoint" "$BACKEND_URL$endpoint"; then
            return 1
        fi
    done
    
    # Check a sample analysis endpoint (should work even without API keys)
    log_info "Testing sample analysis endpoint..."
    response=$(curl -s --connect-timeout $TIMEOUT "$BACKEND_URL/api/analyze/AAPL" || echo "ERROR")
    if [[ "$response" != "ERROR" ]] && echo "$response" | grep -q "stock_symbol"; then
        log_success "Analysis endpoint is responding"
    else
        log_warning "Analysis endpoint may have issues (this is normal without API keys)"
    fi
}

# Check frontend
check_frontend() {
    log_info "Checking frontend..."
    
    if check_service "Frontend" "$FRONTEND_URL"; then
        return 0
    else
        return 1
    fi
}

# Check system resources
check_resources() {
    log_info "Checking system resources..."
    
    # Memory usage
    memory_usage=$(free | grep Mem | awk '{printf "%.1f", $3/$2 * 100.0}')
    memory_int=$(echo "$memory_usage" | cut -d. -f1)
    if [[ "$memory_int" -gt 90 ]]; then
        log_warning "High memory usage: ${memory_usage}%"
    else
        log_success "Memory usage: ${memory_usage}%"
    fi
    
    # Disk usage
    disk_usage=$(df / | tail -1 | awk '{print $5}' | sed 's/%//')
    if [[ "$disk_usage" -gt 90 ]]; then
        log_warning "High disk usage: ${disk_usage}%"
    else
        log_success "Disk usage: ${disk_usage}%"
    fi
}

# Main health check
main() {
    echo "=========================================="
    echo "Stock Sentiment Analyzer - Health Check"
    echo "=========================================="
    echo "Backend URL: $BACKEND_URL"
    echo "Frontend URL: $FRONTEND_URL"
    echo "Timeout: ${TIMEOUT}s"
    echo "=========================================="
    
    local exit_code=0
    
    # Check Docker containers
    if ! check_docker; then
        exit_code=1
    fi
    
    echo ""
    
    # Check backend
    if ! check_backend_endpoints; then
        exit_code=1
    fi
    
    echo ""
    
    # Check frontend
    if ! check_frontend; then
        exit_code=1
    fi
    
    echo ""
    
    # Check resources
    check_resources
    
    echo ""
    echo "=========================================="
    
    if [[ $exit_code -eq 0 ]]; then
        log_success "All health checks passed! 🎉"
    else
        log_error "Some health checks failed! ❌"
    fi
    
    echo "=========================================="
    
    exit $exit_code
}

# Run main function
main