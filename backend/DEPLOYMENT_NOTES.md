# Backend Deployment Notes

## Main Backend Deployment

**Script ID**: `1qk739eu7fCemaRC4VtJovLQ8Vuc5ZVGyXuQcOaSKEMwyD37Z4oVpvjhB`

**Deployment URL**: `https://script.google.com/macros/s/AKfycbzMprg1hHcDd8Ck2G6QxOEU02CtzTPiJzFpPo54i8HL8_TkVS9gJ_ww3arc-QsC6tmm/exec`

**Note**: The old deployment URL is being reused. The backend code is pushed to the new script ID, then manually copied to the old deployment.

### How to Push Main Backend

When you say "push Main Backend", the files inside the `Main Backend/` folder need to be pushed to the script ID above.

**Command to push:**

```bash
cd /Users/shan/Desktop/Projects/ssb-student-portal/backend/temp_push
clasp push --force
```

### Files that get pushed:
- `Code.js` → Main backend logic
- `Backend Zoom.js` → Zoom integration
- `Content Management.js` → Content management functions
- `Conditional_Logic_Functions.js` → Conditional logic
- `appsscript.json` → Apps Script manifest

### Important Notes:
- The `temp_push` directory is configured to push to the correct script ID
- Always use `--force` flag to override existing files
- After pushing, the deployment is live immediately (deployed as web app with "Anyone" access)
- No need to manually deploy after pushing

### Deployment URL:
The backend is deployed at: `https://script.google.com/macros/s/[DEPLOYMENT_ID]/exec`

### Sheet Name Reference:
- The backend reads from **"Resources Management"** sheet (with 's')
- NOT "Resource Management" (without 's')

### Quick Push Command:
```bash
cd /Users/shan/Desktop/Projects/ssb-student-portal/backend/temp_push && clasp push --force
```
