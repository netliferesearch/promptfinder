# Firebase Cloud Functions Monitoring Dashboard Setup

This guide outlines how to set up monitoring for your Firebase Cloud Functions to track performance, errors, and resource usage.

## Prerequisites

- Firebase project with Cloud Functions deployed
- Google Cloud Platform access for the project
- Firebase CLI installed and configured

## Step 1: Access Cloud Monitoring

1. Navigate to the [Google Cloud Console](https://console.cloud.google.com/)
2. Select your Firebase project
3. In the left navigation menu, go to "Monitoring" > "Overview"

## Step 2: Create a Custom Dashboard

1. In the Cloud Monitoring section, go to "Dashboards" > "Create Dashboard"
2. Name your dashboard "PromptFinder Cloud Functions Monitoring"

## Step 3: Add Execution Time Metrics

1. Click "Add Widget" > "Line Chart"
2. Configure the widget:
   - Title: "Function Execution Times"
   - Metric: `cloud_functions/execution_times`
   - Filter by function name:
     - `recalculateRating`
     - `updateFavoritesCount`
     - `recalculateAllStats`
     - `incrementUsageCount`
   - Group By: `function_name`
   - Aggregation: 95th percentile
3. Save the widget

## Step 4: Add Error Rate Metrics

1. Click "Add Widget" > "Line Chart"
2. Configure the widget:
   - Title: "Function Error Rates"
   - Metric: `cloud_functions/function/execution_count`
   - Filter: `status = "error"`
   - Group By: `function_name`
   - Aggregation: Count
3. Save the widget

## Step 5: Add Memory Usage Metrics

1. Click "Add Widget" > "Line Chart"
2. Configure the widget:
   - Title: "Function Memory Usage"
   - Metric: `cloud_functions/function/user_memory_bytes`
   - Group By: `function_name`
   - Aggregation: Maximum
3. Save the widget

## Step 6: Add Log Error Count Widget

1. Click "Add Widget" > "Logs Panel"
2. Configure the widget:

   - Title: "Critical Function Errors"
   - Log query:

   ```
   resource.type="cloud_function"
   severity>=ERROR
   jsonPayload.severity="ERROR"
   ```

3. Save the widget

## Step 7: Set Up Alerting Policies

### Execution Time Alert

1. Go to "Alerting" > "Create Policy"
2. Set conditions:
   - Metric: `cloud_functions/execution_times`
   - Filter: `function_name` (select your functions)
   - Threshold: > 5000 ms (adjust as needed)
   - Duration: 5 minutes
3. Configure notifications (email, Slack, PagerDuty, etc.)
4. Name the policy "Function Execution Time Alert"
5. Save the policy

### Error Rate Alert

1. Go to "Alerting" > "Create Policy"
2. Set conditions:
   - Metric: `cloud_functions/function/execution_count`
   - Filter: `status = "error"`
   - Threshold: > 5 errors in 5 minutes (adjust as needed)
3. Configure notifications
4. Name the policy "Function Error Rate Alert"
5. Save the policy

## Step 8: Log-Based Monitoring

Create a log-based metric:

1. Go to Logging > Logs Explorer
2. Enter the query:

   ```
   resource.type="cloud_function"
   jsonPayload.severity="ERROR"
   ```

3. Click "Create Metric"
4. Configure:
   - Name: "critical_function_errors"
   - Type: Counter
   - Filter: (leave as is)
   - Labels: Add `errorType`, `function`
5. Save the metric

## Step 9: Test the Monitoring

1. Trigger each Cloud Function with valid and invalid inputs
2. Check that the metrics appear correctly on your dashboard
3. Verify that the logging works by checking the Logs Explorer

## Step 10: Regular Maintenance

- Review your dashboard weekly
- Adjust alert thresholds based on patterns
- Consider setting up anomaly detection for more advanced monitoring

---

## Additional Resources

- [Cloud Monitoring Documentation](https://cloud.google.com/monitoring/docs)
- [Cloud Logging Documentation](https://cloud.google.com/logging/docs)
- [Cloud Functions Monitoring Guide](https://cloud.google.com/functions/docs/monitoring)
