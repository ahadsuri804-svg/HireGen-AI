import React, { useState } from "react";
import Header from "../components/Header"; 

export default function Profile() {
  const [profilePic, setProfilePic] = useState("/user.jpeg");
  const [education, setEducation] = useState([
    { degree: "", institute: "", grade: "", year: "" },
  ]);
  const [experience, setExperience] = useState([
    { jobTitle: "", company: "", duration: "", responsibilities: "" },
  ]);
  const [form, setForm] = useState({
    name: "",
    dob: "",
    gender: "",
    cnic: "",
    phone: "",
    email: "",
    address: "",
    country: "",
    city: "",
    zip: "",
  });

  // Handle profile pic
  const handleProfilePic = (e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (ev) => setProfilePic(ev.target.result);
      reader.readAsDataURL(file);
    }
  };

  // Add education field
  const addEducation = () =>
    setEducation([...education, { degree: "", institute: "", grade: "", year: "" }]);

  // Add experience field
  const addExperience = () =>
    setExperience([
      ...experience,
      { jobTitle: "", company: "", duration: "", responsibilities: "" },
    ]);

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <Header />

      <div className="max-w-4xl mx-auto p-6">
        <h2 className="text-2xl font-bold mb-6 text-gray-800">User Profile</h2>

        {/* Profile Picture */}
        <div className="flex flex-col items-center mb-8">
          <img
            src={profilePic}
            alt="Profile"
            className="w-36 h-36 rounded-full object-cover border-2 border-gray-300 shadow"
          />
          <input
            type="file"
            accept="image/*"
            onChange={handleProfilePic}
            className="mt-3"
          />
        </div>

        {/* Personal Info */}
        <div className="bg-white rounded-xl shadow p-6 mb-8">
          <h3 className="text-xl font-semibold mb-4">Personal Information</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <input
              type="text"
              placeholder="Full Name"
              className="input"
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
            />
            <input
              type="date"
              placeholder="Date of birth"
              className="input"
              value={form.dob}
              onChange={(e) => setForm({ ...form, dob: e.target.value })}
            />
            <select
              className="input"
              value={form.gender}
              onChange={(e) => setForm({ ...form, gender: e.target.value })}
            >
              <option value="">Select Gender</option>
              <option value="male">Male</option>
              <option value="female">Female</option>
              <option value="other">Other</option>
            </select>
            <input
              type="text"
              placeholder="CNIC"
              className="input"
              value={form.cnic}
              onChange={(e) => setForm({ ...form, cnic: e.target.value })}
            />
            <input
              type="text"
              placeholder="Phone"
              className="input"
              value={form.phone}
              onChange={(e) => setForm({ ...form, phone: e.target.value })}
            />
            <input
              type="email"
              placeholder="Email"
              className="input"
              value={form.email}
              onChange={(e) => setForm({ ...form, email: e.target.value })}
            />
            <input
              type="text"
              placeholder="Address"
              className="input"
              value={form.address}
              onChange={(e) => setForm({ ...form, address: e.target.value })}
            />
            <input
              type="text"
              placeholder="Zip Code"
              className="input"
              value={form.zip}
              onChange={(e) => setForm({ ...form, zip: e.target.value })}
            />
          </div>
        </div>

        {/* Education */}
        <div className="bg-white rounded-xl shadow p-6 mb-8">
          <h3 className="text-xl font-semibold mb-4">Education Details</h3>
          {education.map((edu, idx) => (
            <div key={idx} className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
              <input type="text" placeholder="Degree" className="input" />
              <input type="text" placeholder="Institute" className="input" />
              <input type="text" placeholder="Grade" className="input" />
              <input type="number" placeholder="Passing Year" className="input" />
            </div>
          ))}
          <button
            onClick={addEducation}
            className="px-4 py-2 text-sm bg-blue-600 text-white rounded hover:bg-blue-700"
          >
            + Add More Education
          </button>
        </div>

        {/* Experience */}
        <div className="bg-white rounded-xl shadow p-6 mb-8">
          <h3 className="text-xl font-semibold mb-4">Experience Details</h3>
          {experience.map((exp, idx) => (
            <div key={idx} className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
              <input type="text" placeholder="Job Title" className="input" />
              <input type="text" placeholder="Company Name" className="input" />
              <input type="text" placeholder="Duration" className="input" />
              <input type="text" placeholder="Responsibilities" className="input" />
            </div>
          ))}
          <button
            onClick={addExperience}
            className="px-4 py-2 text-sm bg-blue-600 text-white rounded hover:bg-blue-700"
          >
            + Add More Experience
          </button>
        </div>

        {/* Save */}
        <div className="text-right">
          <button className="px-6 py-2 bg-green-600 text-white font-medium rounded hover:bg-green-700">
            Save Profile
          </button>
        </div>
      </div>
    </div>
  );
}
