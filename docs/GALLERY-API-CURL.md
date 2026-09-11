# Gallery API - cURL Commands

## 📸 Get Gallery List

### Basic cURL Command

```bash
curl --location 'https://tigerservers.in/aips/api/gallery/list?token=YOUR_AUTH_TOKEN&auth=YOUR_AUTH_TOKEN' \
--header 'Accept: application/json' \
--header 'Authorization: Bearer YOUR_AUTH_TOKEN' \
--header 'X-Authorization: Bearer YOUR_AUTH_TOKEN' \
--header 'auth: YOUR_AUTH_TOKEN'
```

---

## 🔑 With Your Current Token

Replace `YOUR_AUTH_TOKEN` with your actual token from login:

```bash
curl --location 'https://tigerservers.in/aips/api/gallery/list?token=eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9.eyJpYXQiOjE3NzEzMTg1NzgsImRhdGEiOnsidXNlcl9pZCI6IjI0NiIsIm1hcElkIjoiMjQ1IiwidXNlcm5hbWUiOiI5Nzg5Njc1NzYzIiwiYWNlZGVtaWNfeXIiOiIyMDI0LTIwMjUiLCJlbWFpbCI6bnVsbCwidXNlcl90eXBlIjoiMiIsImxvZ2dlZF9pbiI6dHJ1ZX19.ZGu8ykDcp1OFzPWTHAp9TFqOU093-wWPywPpz3bh3e0&auth=eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9.eyJpYXQiOjE3NzEzMTg1NzgsImRhdGEiOnsidXNlcl9pZCI6IjI0NiIsIm1hcElkIjoiMjQ1IiwidXNlcm5hbWUiOiI5Nzg5Njc1NzYzIiwiYWNlZGVtaWNfeXIiOiIyMDI0LTIwMjUiLCJlbWFpbCI6bnVsbCwidXNlcl90eXBlIjoiMiIsImxvZ2dlZF9pbiI6dHJ1ZX19.ZGu8ykDcp1OFzPWTHAp9TFqOU093-wWPywPpz3bh3e0' \
--header 'Accept: application/json' \
--header 'Authorization: Bearer eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9.eyJpYXQiOjE3NzEzMTg1NzgsImRhdGEiOnsidXNlcl9pZCI6IjI0NiIsIm1hcElkIjoiMjQ1IiwidXNlcm5hbWUiOiI5Nzg5Njc1NzYzIiwiYWNlZGVtaWNfeXIiOiIyMDI0LTIwMjUiLCJlbWFpbCI6bnVsbCwidXNlcl90eXBlIjoiMiIsImxvZ2dlZF9pbiI6dHJ1ZX19.ZGu8ykDcp1OFzPWTHAp9TFqOU093-wWPywPpz3bh3e0' \
--header 'X-Authorization: Bearer eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9.eyJpYXQiOjE3NzEzMTg1NzgsImRhdGEiOnsidXNlcl9pZCI6IjI0NiIsIm1hcElkIjoiMjQ1IiwidXNlcm5hbWUiOiI5Nzg5Njc1NzYzIiwiYWNlZGVtaWNfeXIiOiIyMDI0LTIwMjUiLCJlbWFpbCI6bnVsbCwidXNlcl90eXBlIjoiMiIsImxvZ2dlZF9pbiI6dHJ1ZX19.ZGu8ykDcp1OFzPWTHAp9TFqOU093-wWPywPpz3bh3e0' \
--header 'auth: eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9.eyJpYXQiOjE3NzEzMTg1NzgsImRhdGEiOnsidXNlcl9pZCI6IjI0NiIsIm1hcElkIjoiMjQ1IiwidXNlcm5hbWUiOiI5Nzg5Njc1NzYzIiwiYWNlZGVtaWNfeXIiOiIyMDI0LTIwMjUiLCJlbWFpbCI6bnVsbCwidXNlcl90eXBlIjoiMiIsImxvZ2dlZF9pbiI6dHJ1ZX19.ZGu8ykDcp1OFzPWTHAp9TFqOU093-wWPywPpz3bh3e0'
```

---

## 📋 Expected Response

```json
{
  "status": "success",
  "gallery": [
    {
      "id": "1",
      "title": "Annual Day Celebration",
      "description": "Students performing on stage",
      "image_path": "uploads/gallery/annual_day_2024.jpg",
      "event_date": "2024-12-15",
      "is_active": "1",
      "created_at": "2024-12-16 10:30:00",
      "updated_at": "2024-12-16 10:30:00"
    },
    {
      "id": "2",
      "title": "Sports Day",
      "description": "Athletic events and competitions",
      "image_path": "uploads/gallery/sports_day_2024.jpg",
      "event_date": "2024-11-20",
      "is_active": "1",
      "created_at": "2024-11-21 09:15:00",
      "updated_at": "2024-11-21 09:15:00"
    },
    {
      "id": "3",
      "title": "Science Exhibition",
      "description": "Student projects and experiments",
      "image_path": "uploads/gallery/science_expo_2024.jpg",
      "event_date": "2024-10-10",
      "is_active": "1",
      "created_at": "2024-10-11 14:20:00",
      "updated_at": "2024-10-11 14:20:00"
    }
  ]
}
```

---

## 🔧 Postman Setup

### Method: GET

### URL:
```
https://tigerservers.in/aips/api/gallery/list?token={{token}}&auth={{token}}
```

### Headers:
| Key | Value |
|-----|-------|
| Accept | application/json |
| Authorization | Bearer {{token}} |
| X-Authorization | Bearer {{token}} |
| auth | {{token}} |

### Environment Variable:
- **token**: Your authentication token from login

---

## 🧪 Testing Steps

### 1. **Get Your Token First**
Login to get a fresh token:
```bash
curl --location 'https://tigerservers.in/aips/api/login' \
--form 'username="9789675763"' \
--form 'password="YOUR_PASSWORD"' \
--form 'academic_year="2024-2025"' \
--form 'device_type="1"'
```

### 2. **Copy the Token**
From the login response, copy the `token` value

### 3. **Test Gallery Endpoint**
Use the token in the gallery cURL command above

---

## 🖼️ Get Individual Gallery Image

If you need to fetch a specific image:

```bash
curl --location 'https://tigerservers.in/aips/uploads/gallery/IMAGE_NAME.jpg?token=YOUR_AUTH_TOKEN&auth=YOUR_AUTH_TOKEN' \
--header 'Accept: image/jpeg'
```

---

## 📊 Response Fields Explained

| Field | Type | Description |
|-------|------|-------------|
| `id` | string | Unique gallery item ID |
| `title` | string | Title of the gallery item |
| `description` | string | Description of the event/photo |
| `image_path` | string | Relative path to the image file |
| `event_date` | string | Date of the event (YYYY-MM-DD) |
| `is_active` | string | "1" = active, "0" = inactive |
| `created_at` | string | Creation timestamp |
| `updated_at` | string | Last update timestamp |

---

## 🔍 Troubleshooting

### Error: 401 Unauthorized
**Solution:** Token expired. Login again to get a new token.

### Error: 404 Not Found
**Solution:** Check if the endpoint URL is correct. Should be:
```
https://tigerservers.in/aips/api/gallery/list
```
NOT:
```
https://tigerservers.in/aips/https://tigerservers.in/aips/api/gallery/list
```

### Error: Empty Gallery Array
**Solution:** No gallery items in the database. Check with backend team or add some gallery items.

### Images Not Loading
**Solution:** Construct full image URL:
```
https://tigerservers.in/aips/uploads/gallery/IMAGE_NAME.jpg
```

---

## 💡 Quick Copy-Paste

### Simple Version (No Headers):
```bash
curl 'https://tigerservers.in/aips/api/gallery/list?token=YOUR_TOKEN&auth=YOUR_TOKEN'
```

### With Pretty Print (using jq):
```bash
curl 'https://tigerservers.in/aips/api/gallery/list?token=YOUR_TOKEN&auth=YOUR_TOKEN' | jq
```

### Save Response to File:
```bash
curl 'https://tigerservers.in/aips/api/gallery/list?token=YOUR_TOKEN&auth=YOUR_TOKEN' -o gallery.json
```

---

## 📞 Contact

**School:** Aadhithya International Public Schools  
**Email:** info@aadhithyapublicschools.com  
**Phone:** +91 99406 22669

---

**Last Updated:** February 17, 2026  
**Endpoint:** `/api/gallery/list`  
**Method:** GET  
**Authentication:** Required
