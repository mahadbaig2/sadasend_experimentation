"""Independent Python SDK probe. Defaults to a synthetic transport; never dispatches email."""
import argparse
import io
import json
import os
from email.message import Message
from urllib.response import addinfourl

from sadasend import SadaSend, RetryPolicy, SPEC_VERSION, __version__


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("--dry-run", action="store_true", help="Call the hosted API with dry_run=True")
    args = parser.parse_args()
    recipient = os.environ.get("LAB_TEST_RECIPIENT", "approved@example.com")
    sender = os.environ.get("LAB_FROM", "noreply@onboarding.sadasend.com")
    observations = []

    def opener(request, timeout=30):
        body = json.loads(request.data)
        observations.append({
            "path": request.full_url.split("/emails")[0].endswith("api.sadasend.com"),
            "dry_run": body.get("dry_run"),
            "idempotency": bool(request.get_header("Idempotency-key")),
        })
        data = json.dumps({"id": "mock-message", "status": "queued", "dryRun": True}).encode()
        return addinfourl(io.BytesIO(data), Message(), request.full_url, 200)

    if args.dry_run:
        if not os.environ.get("SADASEND_API_KEY") or not os.environ.get("LAB_TEST_RECIPIENT"):
            parser.error("SADASEND_API_KEY and LAB_TEST_RECIPIENT are required")
        client = SadaSend(os.environ["SADASEND_API_KEY"], retry=RetryPolicy(max_retries=0))
    else:
        client = SadaSend("mock-key", opener=opener, retry=RetryPolicy(max_retries=0))

    result = client.emails.send(from_=sender, to=recipient, subject="SDK integration lab", text="Synthetic SDK test", html="<p>Synthetic SDK test</p>", dry_run=True)
    if not args.dry_run and (len(observations) != 1 or not observations[0]["dry_run"] or not observations[0]["idempotency"]):
        raise AssertionError("SDK did not issue expected dry-run request")
    print(json.dumps({"mode": "live-dry-run" if args.dry_run else "mock", "sdk": __version__, "spec": SPEC_VERSION, "status": result.get("status"), "observations": observations}))


if __name__ == "__main__":
    main()
