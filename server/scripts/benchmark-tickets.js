
import autocannon from "autocannon";

const BASE_URL = (
  process.env.BENCH_URL || "http://localhost:5000"
).replace(/\/+$/, "");

const TOKEN = process.env.BENCH_TOKEN;

const DURATION = Number(process.env.BENCH_DURATION || 20);
const CONNECTIONS = Number(process.env.BENCH_CONNECTIONS || 10);

const url = `${BASE_URL}/api/tickets`;

if (!TOKEN) {
  console.error(
    "Missing BENCH_TOKEN environment variable."
  );
  process.exit(1);
}

if (
  !Number.isFinite(DURATION) ||
  DURATION <= 0 ||
  !Number.isInteger(CONNECTIONS) ||
  CONNECTIONS <= 0
) {
  console.error(
    "DURATION must be positive and CONNECTIONS must be a positive integer."
  );
  process.exit(1);
}

console.log("\n--- ResolveIT API Benchmark ---");
console.log(`URL: ${url}`);
console.log(`Duration: ${DURATION} seconds`);
console.log(`Connections: ${CONNECTIONS}`);
console.log("Starting benchmark...\n");

const instance = autocannon(
  {
    url,
    method: "GET",
    connections: CONNECTIONS,
    duration: DURATION,
    headers: {
      Authorization: `Bearer ${TOKEN}`,
      Accept: "application/json",
    },
    // Log unexpected HTTP responses for debugging.
    verify: (client, statusCode, headers, body) => {
      if (statusCode < 200 || statusCode >= 300) {
        console.error("Unexpected HTTP response:", {
          statusCode,
          body: body.toString().slice(0, 200),
        });
      }
    },
  },
  (error, result) => {
    if (error) {
      console.error(
        "Benchmark failed:",
        error.message
      );
      process.exitCode = 1;
      return;
    }

    const latency = result.latency;
    const requests = result.requests;

    // Autocannon exposes p97.5 and p99, but some versions
    // do not expose a p95 field in the summary.
    const p95 = latency.p95;

    console.log("\n--- ResolveIT API Benchmark Results ---");
    console.log(`URL: ${url}`);
    console.log(`Duration: ${DURATION} seconds`);
    console.log(`Connections: ${CONNECTIONS}`);
    console.log(
      `Requests/sec (average): ${requests.average}`
    );
    console.log(
      `Average latency: ${latency.average} ms`
    );
    console.log(`p50 latency: ${latency.p50} ms`);
    console.log(
      `p95 latency: ${
        p95 ?? "not available in this Autocannon result"
      } ms`
    );
    console.log(
      `p97.5 latency: ${latency.p97_5} ms`
    );
    console.log(`p99 latency: ${latency.p99} ms`);
    console.log(`Maximum latency: ${latency.max} ms`);
    console.log(`Total requests: ${requests.total}`);
    console.log(
      `Successful 2xx responses: ${result['2xx'] ?? "not reported"}`
    );
    console.log(
      `Non-2xx responses: ${result.non2xx}`
    );
    console.log(`Autocannon errors: ${result.errors}`);
    console.log(`Timeouts: ${result.timeouts}`);

    const failedResponses = result.non2xx || 0;
    const errors = result.errors || 0;
    const timeouts = result.timeouts || 0;

    const failureRate =
      requests.total > 0
        ? ((failedResponses + errors + timeouts) /
            requests.total) *
          100
        : 0;

    console.log(
      `Approx. failure rate: ${failureRate.toFixed(2)}%`
    );

    console.log(
      "\nAvailable latency fields:",
      Object.keys(latency).join(", ")
    );

    if (result.non2xx > 0) {
      console.warn(
        "\nWARNING: Some requests returned non-2xx responses. Review the logged response details."
      );
    }

    if (errors > 0 || timeouts > 0) {
      console.warn(
        "\nWARNING: Errors or timeouts occurred during the benchmark."
      );
    }

    console.log("\nBenchmark completed.\n");
  }
);

instance.on("error", (error) => {
  console.error("Autocannon error:", error.message);
  process.exitCode = 1;
});
