# Multi-Task Job Queue System

## Description
A scalable job queue system using **BullMQ** and **Redis** for asynchronous task processing. Currently supports **email sending jobs** with progress tracking, retry mechanisms, and a dead-letter queue. Integrated **Bull Board** for real-time monitoring of queues.

## Features Implemented
- Asynchronous email job processing with **concurrent workers**  
- **Retry mechanism** for failed jobs  
- **Dead-letter queue** for jobs that fail after max retries  
- **Job progress tracking**  
- **Metrics endpoint** (processed jobs, failed jobs, avg. processing time)  
- **Bull Board dashboard** for monitoring queues  

## To Do / Future Enhancements
- Add support for **additional job types** beyond email  
- Implement **automatic cleanup of completed jobs** for Redis memory management  
- Enhance **error handling** and logging  
- Add **authentication** for Bull Board UI  
- Implement **email templating** and attachments support  

## Getting Started
1. Install dependencies:  
```bash
npm install
```

2. **Access Bull Board:**
``` bash
http://localhost:3000/admin/queues
```
3. **API Endpoints:**

- **POST /send-email** → Add email jobs  
- **GET /metrics** → Retrieve job metrics  
- **GET /health** → Check server health

