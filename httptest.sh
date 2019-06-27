#!/bin/sh
wrk -t5 -d60s -s httptest_post.lua "http://localhost:3000/json"
# wrk -t5 -d60s -s httptest_post.lua "http://localhost:3000/"

# ab -t 60 -n 50000 "http://localhost:3000/"
# ab -t 60 -T "application/json" -p test.txt http://localhost:3000/json
