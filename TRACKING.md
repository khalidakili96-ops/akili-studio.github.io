# Website analytics and enquiry measurement

The Google Analytics web-stream Measurement ID is `G-6GSBP5QVWV`.

## Behaviour

- All 14 canonical public pages load the local consent interface. Google Analytics loads only on `akilis.studio` or `www.akilis.studio`, after an explicit opt-in or a valid saved opt-in.
- The Allow analytics and Decline controls save the preference for 180 days. Analytics settings in the footer reopens the choice. Storage restrictions do not stop the form or browsing.
- Advertising consent stays denied. Google signals and advertising personalisation are disabled in the tag configuration. Withdrawing consent disables collection and clears accessible `_ga` cookies.
- One explicit `page_view` uses the canonical page URL. Query strings and fragments are excluded, and only the referrer origin is passed. This deliberately omits query-based campaign attribution as well as potentially sensitive URL values.
- A valid application uses the existing FormSubmit recipient through its AJAX endpoint. Only an HTTP success with `success: true` or `success: "true"` creates `generate_lead`, and only when analytics is allowed. The event contains fixed source metadata, not names, contact details, project fields or form contents.
- Pending submissions disable the submit control. Failed or unconfirmed submissions retain entries and show an accessible message without automatic retry. Browsers without Fetch or FormData retain the native POST fallback. The fallback and a `?submitted=true` return URL do not create Analytics leads.

`generate_lead` measures service-accepted submissions from consenting visitors. It does not establish inbox delivery, unique people, qualification or sales. Declined/blocked Analytics and native fallback submissions are not in these Analytics counts.

## Validation

Run `pnpm install --frozen-lockfile --ignore-scripts`, `pnpm test`, and `python scripts/seo_audit.py`. The behaviour suite executes local DOM fixtures and mocks the form response; it does not contact Google Analytics or FormSubmit.

## Release verification

After the reviewed website deployment is approved:

1. Confirm the published pages load the consent interface and keep Google Analytics unloaded before opt-in and after an initial decline.
2. Confirm a consenting visit appears in GA4 Realtime/DebugView for property `555038557` with the expected canonical URL.
3. Have the founder make one clearly labelled real test enquiry and confirm the FormSubmit recipient is activated, the response is accepted, and the email arrives.
4. Confirm exactly one `generate_lead` for that consenting test, without form entries in its parameters. Mark `generate_lead` as a GA4 key event for session conversion reporting after verifying it. Do not reuse the unrelated `purchase` or existing Ads quote event merely because its name sounds relevant.
5. Update the private performance record with deployment, test and key-event evidence. Check Analytics collection against the stream's enhanced-measurement settings as part of the live test.

Rollback by reverting the reviewed commit. This removes the tracking resources and restores the previous native form handling. Old Analytics reports remain historical records.
