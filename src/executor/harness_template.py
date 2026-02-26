import json as _json, sys, io, traceback, time, base64

# ===== USER CODE START =====
{user_code}
# ===== USER CODE END =====

# Test cases are base64-encoded JSON to avoid Python/JSON boolean literal conflicts
test_cases = _json.loads(base64.b64decode("{test_cases_b64}").decode("utf-8"))
function_name = "{function_name}"

results = []

for i, tc in enumerate(test_cases):
    captured = io.StringIO()
    old_stdout = sys.stdout
    sys.stdout = captured
    try:
        start = time.perf_counter()
        fn = globals()[function_name]
        actual = fn(**tc["input"])
        elapsed = time.perf_counter() - start
        sys.stdout = old_stdout
        stdout_val = captured.getvalue()
        if len(stdout_val) > 10240:
            stdout_val = stdout_val[:10240] + "\n[stdout truncated at 10KB]"
        passed = actual == tc["expected"]
        results.append({
            "index": i,
            "passed": passed,
            "input": tc["input"],
            "expected": tc["expected"],
            "actual": actual,
            "stdout": stdout_val,
            "runtime_ms": round(elapsed * 1000, 2),
            "error": None
        })
    except Exception as e:
        sys.stdout = old_stdout
        stdout_val = captured.getvalue()
        if len(stdout_val) > 10240:
            stdout_val = stdout_val[:10240] + "\n[stdout truncated]"
        results.append({
            "index": i,
            "passed": False,
            "input": tc["input"],
            "expected": tc["expected"],
            "actual": None,
            "stdout": stdout_val,
            "runtime_ms": None,
            "error": traceback.format_exc()
        })

sys.stdout = sys.__stdout__
print(_json.dumps({"results": results}))
