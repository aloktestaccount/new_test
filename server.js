const express = require('express');
const axios = require('axios');
const cors = require('cors');
const path = require('path');
const https = require('https');

const app = express();
const port = 3000;

// Use CORS middleware
app.use(cors());

// Middleware to parse JSON bodies
app.use(express.json());

// Serve static files from the 'public' directory
app.use(express.static(path.join(__dirname, 'public')));

// Create an HTTPS agent that ignores certificate errors
const httpsAgent = new https.Agent({ rejectUnauthorized: false });

// Define your constant cookies
const PHPSESSID = 'peqqj4dpe3541uoqn32484aguq';
const token_id = '96c50ff5e97b94e49d29274c60bed82bc051e0e87061c07d78324107a5775320699fbae17a29dd0663b0310c1301ef8843ed3fd942bf4d4914565875e4f6194d';

// Route to handle search form submission and proxy request
app.post('/search', async (req, res) => {
  const { rollno } = req.body;

  if (!rollno) {
    return res.status(400).json({ message: 'Roll number is required' });
  }

  try {
    // Proxy request to your backend API with custom HTTPS agent
    const response = await axios.post('https://v1.nitj.ac.in/hostelsNITJ/self_verification.php', {
      rollno: rollno
    }, {
      headers: {
        'Content-Type': 'application/json',
        'Cookie': `PHPSESSID=${PHPSESSID}; token_id=${token_id}`
      },
      httpsAgent: httpsAgent
    });

    // Process and clean up the data
    const student = response.data.studentData;
    const documents = response.data.documents;

    // Remove unnecessary fields
    delete student.sno;
    delete student.timestamp;
    delete student.uploaded;
    delete student.self_verified;

    delete documents.sno;
    delete documents.timestamp;
    delete documents.uploaded;
    delete documents.rollno;
    delete documents.clerk_verified;

    // Send cleaned data back to the client
    res.json({
      message: response.data.message || 'Success',
      studentData: student,
      documents: documents
    });
  } catch (error) {
    console.error("Error occurred while fetching data:", error.message);
    res.status(500).json({ message: 'Error fetching data', error: error.message });
  }
});

app.listen(port, () => {
  console.log(`Server running at http://localhost:${port}`);
});
