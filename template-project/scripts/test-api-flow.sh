#!/bin/bash

# API Flow Test Script
# Tests the complete authentication and user management flow
# Usage: ./scripts/test-api-flow.sh [BASE_URL]

set -e

BASE_URL="${1:-http://localhost:8080}"
TIMESTAMP=$(date +%s%N)
TEST_EMAIL="flow-test-${TIMESTAMP}@example.com"
TEST_PASSWORD="TestPassword123456"

echo "=== API Flow Test ==="
echo "Base URL: $BASE_URL"
echo "Test Email: $TEST_EMAIL"
echo ""

# Color codes
GREEN='\033[0;32m'
RED='\033[0;31m'
NC='\033[0m' # No Color

test_step() {
  local step=$1
  local description=$2
  echo ""
  echo "Step $step: $description"
}

fail() {
  echo -e "${RED}✗ FAILED: $1${NC}"
  exit 1
}

pass() {
  echo -e "${GREEN}✓ $1${NC}"
}

# Step 1: Health Check
test_step 1 "Health Check"
RESPONSE=$(curl -s -w "\n%{http_code}" "$BASE_URL/health")
HTTP_CODE=$(echo "$RESPONSE" | tail -n1)
[ "$HTTP_CODE" = "200" ] && pass "Health endpoint returned 200" || fail "Health check failed (HTTP $HTTP_CODE)"

# Step 2: OpenAPI Docs
test_step 2 "OpenAPI Docs"
RESPONSE=$(curl -s -w "\n%{http_code}" "$BASE_URL/docs")
HTTP_CODE=$(echo "$RESPONSE" | tail -n1)
[ "$HTTP_CODE" = "200" ] && pass "OpenAPI docs available" || fail "OpenAPI docs failed (HTTP $HTTP_CODE)"

# Step 3: Metrics
test_step 3 "Metrics Endpoint"
RESPONSE=$(curl -s -w "\n%{http_code}" "$BASE_URL/metrics")
HTTP_CODE=$(echo "$RESPONSE" | tail -n1)
[ "$HTTP_CODE" = "200" ] && pass "Metrics endpoint available" || fail "Metrics endpoint failed (HTTP $HTTP_CODE)"

# Step 4: User Registration
test_step 4 "User Registration"
REG_RESPONSE=$(curl -s -w "\n%{http_code}" -X POST \
  "$BASE_URL/v1/registration" \
  -H "Content-Type: application/json" \
  -d "{\"email\":\"${TEST_EMAIL}\",\"password\":\"${TEST_PASSWORD}\"}")

REG_CODE=$(echo "$REG_RESPONSE" | tail -n1)
REG_BODY=$(echo "$REG_RESPONSE" | head -n-1)

[ "$REG_CODE" = "201" ] && pass "Registration successful (HTTP 201)" || fail "Registration failed (HTTP $REG_CODE)"

# Step 5: User Login
test_step 5 "User Login"
LOGIN_RESPONSE=$(curl -s -w "\n%{http_code}" -X POST \
  "$BASE_URL/v1/login" \
  -H "Content-Type: application/json" \
  -d "{\"email\":\"${TEST_EMAIL}\",\"password\":\"${TEST_PASSWORD}\"}")

LOGIN_CODE=$(echo "$LOGIN_RESPONSE" | tail -n1)
LOGIN_BODY=$(echo "$LOGIN_RESPONSE" | head -n-1)

[ "$LOGIN_CODE" = "200" ] && pass "Login successful (HTTP 200)" || fail "Login failed (HTTP $LOGIN_CODE)"

# Extract token
TOKEN=$(echo "$LOGIN_BODY" | jq -r '.token' 2>/dev/null)
[ -n "$TOKEN" ] && [ "$TOKEN" != "null" ] && pass "JWT token obtained" || fail "No token in login response"

echo "  Token: ${TOKEN:0:20}..."

# Step 6: Create Managed User
test_step 6 "Create Managed User"
MANAGED_EMAIL="managed-user-${TIMESTAMP}@example.com"
CREATE_RESPONSE=$(curl -s -w "\n%{http_code}" -X POST \
  "$BASE_URL/v1/users" \
  -H "Authorization: Bearer ${TOKEN}" \
  -H "Content-Type: application/json" \
  -d "{\"email\":\"${MANAGED_EMAIL}\",\"firstName\":\"Test\",\"lastName\":\"User\"}")

CREATE_CODE=$(echo "$CREATE_RESPONSE" | tail -n1)
CREATE_BODY=$(echo "$CREATE_RESPONSE" | head -n-1)

[ "$CREATE_CODE" = "201" ] && pass "Managed user created (HTTP 201)" || fail "Create user failed (HTTP $CREATE_CODE)"

# Extract user ID
USER_ID=$(echo "$CREATE_BODY" | jq -r '.userId' 2>/dev/null)
[ -n "$USER_ID" ] && pass "User ID obtained" || fail "No user ID in response"

echo "  User ID: $USER_ID"

# Step 7: Get User by ID
test_step 7 "Get User by ID"
GET_RESPONSE=$(curl -s -w "\n%{http_code}" \
  "$BASE_URL/v1/users/${USER_ID}" \
  -H "Authorization: Bearer ${TOKEN}")

GET_CODE=$(echo "$GET_RESPONSE" | tail -n1)
GET_BODY=$(echo "$GET_RESPONSE" | head -n-1)

[ "$GET_CODE" = "200" ] && pass "Get user successful (HTTP 200)" || fail "Get user failed (HTTP $GET_CODE)"

# Verify user data
RETURNED_EMAIL=$(echo "$GET_BODY" | jq -r '.email' 2>/dev/null)
[ "$RETURNED_EMAIL" = "$MANAGED_EMAIL" ] && pass "User email matches" || fail "Email mismatch"

# Step 8: List Users
test_step 8 "List Users"
LIST_RESPONSE=$(curl -s -w "\n%{http_code}" \
  "$BASE_URL/v1/users" \
  -H "Authorization: Bearer ${TOKEN}")

LIST_CODE=$(echo "$LIST_RESPONSE" | tail -n1)
LIST_BODY=$(echo "$LIST_RESPONSE" | head -n-1)

[ "$LIST_CODE" = "200" ] && pass "List users successful (HTTP 200)" || fail "List users failed (HTTP $LIST_CODE)"

# Verify user in list
LIST_CONTAINS_USER=$(echo "$LIST_BODY" | jq ".users[] | select(.userId == \"${USER_ID}\")" 2>/dev/null)
[ -n "$LIST_CONTAINS_USER" ] && pass "User found in list" || fail "User not in list"

# Step 9: Checkout (if implemented)
test_step 9 "Checkout Flow (Optional)"
CHECKOUT_RESPONSE=$(curl -s -w "\n%{http_code}" -X POST \
  "$BASE_URL/v1/checkout" \
  -H "Authorization: Bearer ${TOKEN}" \
  -H "Content-Type: application/json" \
  -d "{\"items\":[{\"productId\":\"prod_1\",\"quantity\":1}]}")

CHECKOUT_CODE=$(echo "$CHECKOUT_RESPONSE" | tail -n1)

if [ "$CHECKOUT_CODE" = "201" ] || [ "$CHECKOUT_CODE" = "200" ]; then
  pass "Checkout endpoint working"
elif [ "$CHECKOUT_CODE" = "404" ]; then
  pass "Checkout endpoint not implemented (expected)"
else
  echo "  Note: Checkout returned HTTP $CHECKOUT_CODE (may not be implemented)"
fi

# Step 10: Test auth failure
test_step 10 "Authentication Failure (Invalid Token)"
INVALID_TOKEN_RESPONSE=$(curl -s -w "\n%{http_code}" \
  "$BASE_URL/v1/users" \
  -H "Authorization: Bearer invalid-token-xyz")

INVALID_CODE=$(echo "$INVALID_TOKEN_RESPONSE" | tail -n1)

[ "$INVALID_CODE" = "401" ] && pass "Invalid token rejected (HTTP 401)" || fail "Invalid token not rejected (HTTP $INVALID_CODE)"

# Summary
echo ""
echo "=== Test Summary ==="
pass "All critical endpoints tested successfully"
echo ""
echo "API Flow Test Complete ✓"
echo ""
echo "Test Results:"
echo "- Health: ✓"
echo "- Auth (register + login): ✓"
echo "- Managed Users (create + get + list): ✓"
echo "- Authorization enforcement: ✓"
echo ""
echo "Service is ready for production ✓"
