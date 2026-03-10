import { useState } from "react";

const PROMOTER_FIELDS = [
  { id: "fullName", label: "Full Name", type: "text", placeholder: "John Doe" },
  { id: "email", label: "Email Address", type: "email", placeholder: "john@email.com" },
  { id: "phone", label: "Phone Number", type: "tel", placeholder: "+27 82 000 0000" },
  { id: "idNumber", label: "ID Number", type: "text", placeholder: "0000000000000" },
  { id: "password", label: "Password", type: "password", placeholder: "••••••••" },
  { id: "confirmPassword", label: "Confirm Password", type: "password", placeholder: "••••••••" },
];

const BUSINESS_FIELDS = [
  { id: "companyName", label: "Company Name", type: "text", placeholder: "Acme Corp" },
  { id: "contactName", label: "Contact Person", type: "text", placeholder: "Jane Smith" },
  { id: "email", label: "Business Email", type: "email", placeholder: "contact@company.com" },
  { id: "phone", label: "Business Phone", type: "tel", placeholder: "+27 11 000 0000" },
  { id: "regNumber", label: "Registration Number", type: "text", placeholder: "2024/000000/07" },
  { id: "password", label: "Password", type: "password", placeholder: "••••••••" },
  { id: "confirmPassword", label: "Confirm Password", type: "password", placeholder: "••••••••" },
];

export default function RegisterPage() {
  const [role, setRole] = useState("promoter");
  const [form, setForm] = useState({});
  const [submitted, setSubmitted] = useState(false);
  const [focused, setFocused] = useState(null);

  const fields = role === "promoter" ? PROMOTER_FIELDS : BUSINESS_FIELDS;

  const handleChange = (id, value) => setForm(prev => ({ ...prev, [id]: value }));

  const handleSubmit = () => {
    setSubmitted(true);
    setTimeout(() => setSubmitted(false), 3000);
  };

  const switchRole = (newRole) => {
    setRole(newRole);
    setForm({});
  };

  return (
    <div style={{
      minHeight: "100vh",
      background: "#0a0a0f",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      fontFamily: "'Georgia', serif",
      padding: "40px 16px",
      position: "relative",
      overflow: "hidden",
    }}>
      {/* Background grid */}
      <div style={{
        position: "fixed", inset: 0, zIndex: 0,
        backgroundImage: `
          linear-gradient(rgba(255,190,50,0.04) 1px, transparent 1px),
          linear-gradient(90deg, rgba(255,190,50,0.04) 1px, transparent 1px)
        `,
        backgroundSize: "48px 48px",
      }} />

      {/* Glow */}
      <div style={{
        position: "fixed", top: "-20%", left: "50%", transform: "translateX(-50%)",
        width: "600px", height: "400px", borderRadius: "50%",
        background: role === "promoter"
          ? "radial-gradient(ellipse, rgba(255,180,0,0.12) 0%, transparent 70%)"
          : "radial-gradient(ellipse, rgba(0,180,255,0.1) 0%, transparent 70%)",
        transition: "background 0.6s ease",
        zIndex: 0,
      }} />

      <div style={{
        position: "relative", zIndex: 1,
        width: "100%", maxWidth: "480px",
      }}>
        {/* Header */}
        <div style={{ textAlign: "center", marginBottom: "36px" }}>
          <div style={{
            display: "inline-block",
            fontSize: "11px", letterSpacing: "4px", textTransform: "uppercase",
            color: role === "promoter" ? "#ffbe32" : "#32c8ff",
            border: `1px solid ${role === "promoter" ? "rgba(255,190,50,0.3)" : "rgba(50,200,255,0.3)"}`,
            padding: "6px 16px", borderRadius: "2px", marginBottom: "20px",
            transition: "all 0.4s ease",
          }}>
            Create Account
          </div>
          <h1 style={{
            color: "#f5f0e8", fontSize: "32px", fontWeight: "400",
            margin: "0 0 8px", letterSpacing: "-0.5px",
          }}>
            Join the Platform
          </h1>
          <p style={{ color: "#666", fontSize: "14px", margin: 0, fontFamily: "'Georgia', serif", fontStyle: "italic" }}>
            Select your role to get started
          </p>
        </div>

        {/* Role Toggle */}
        <div style={{
          display: "flex", background: "#111118",
          border: "1px solid #222230", borderRadius: "6px",
          padding: "4px", marginBottom: "32px", gap: "4px",
        }}>
          {["promoter", "business"].map(r => (
            <button key={r} onClick={() => switchRole(r)} style={{
              flex: 1, padding: "12px",
              background: role === r
                ? (r === "promoter" ? "rgba(255,190,50,0.12)" : "rgba(50,200,255,0.1)")
                : "transparent",
              border: role === r
                ? `1px solid ${r === "promoter" ? "rgba(255,190,50,0.4)" : "rgba(50,200,255,0.3)"}`
                : "1px solid transparent",
              borderRadius: "4px",
              color: role === r
                ? (r === "promoter" ? "#ffbe32" : "#32c8ff")
                : "#555",
              fontSize: "13px", letterSpacing: "2px",
              textTransform: "uppercase", cursor: "pointer",
              transition: "all 0.3s ease", fontFamily: "'Georgia', serif",
            }}>
              {r === "promoter" ? "⚡ Promoter" : "🏢 Business"}
            </button>
          ))}
        </div>

        {/* Form Card */}
        <div style={{
          background: "#0e0e16",
          border: "1px solid #1e1e2e",
          borderRadius: "8px",
          padding: "32px",
          boxShadow: "0 24px 80px rgba(0,0,0,0.6)",
        }}>
          {/* Role description */}
          <div style={{
            background: role === "promoter" ? "rgba(255,190,50,0.06)" : "rgba(50,200,255,0.06)",
            border: `1px solid ${role === "promoter" ? "rgba(255,190,50,0.15)" : "rgba(50,200,255,0.15)"}`,
            borderRadius: "4px", padding: "12px 16px", marginBottom: "28px",
            transition: "all 0.4s ease",
          }}>
            <p style={{
              margin: 0, fontSize: "13px", lineHeight: "1.6",
              color: role === "promoter" ? "rgba(255,190,50,0.85)" : "rgba(50,200,255,0.85)",
            }}>
              {role === "promoter"
                ? "Register as a Promoter to view & accept jobs, check in to shifts, and track your earnings."
                : "Register as a Business to manage teams, monitor attendance, and oversee job assignments."}
            </p>
          </div>

          {/* Fields */}
          <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
            {fields.map((field, i) => (
              <div key={`${role}-${field.id}`} style={{
                opacity: 1,
                animation: `fadeSlideIn 0.3s ease ${i * 0.05}s both`,
              }}>
                <label style={{
                  display: "block", fontSize: "11px", letterSpacing: "2px",
                  textTransform: "uppercase", marginBottom: "8px",
                  color: focused === field.id
                    ? (role === "promoter" ? "#ffbe32" : "#32c8ff")
                    : "#555",
                  transition: "color 0.2s ease",
                }}>
                  {field.label}
                </label>
                <input
                  type={field.type}
                  placeholder={field.placeholder}
                  value={form[field.id] || ""}
                  onChange={e => handleChange(field.id, e.target.value)}
                  onFocus={() => setFocused(field.id)}
                  onBlur={() => setFocused(null)}
                  style={{
                    width: "100%", boxSizing: "border-box",
                    background: "#080810",
                    border: focused === field.id
                      ? `1px solid ${role === "promoter" ? "rgba(255,190,50,0.5)" : "rgba(50,200,255,0.5)"}`
                      : "1px solid #1e1e2e",
                    borderRadius: "4px", padding: "13px 16px",
                    color: "#f0ece0", fontSize: "14px",
                    outline: "none", fontFamily: "'Georgia', serif",
                    transition: "border-color 0.2s ease",
                    boxShadow: focused === field.id
                      ? `0 0 0 3px ${role === "promoter" ? "rgba(255,190,50,0.06)" : "rgba(50,200,255,0.06)"}`
                      : "none",
                  }}
                />
              </div>
            ))}
          </div>

          {/* Submit */}
          <button onClick={handleSubmit} style={{
            marginTop: "32px", width: "100%", padding: "16px",
            background: submitted
              ? (role === "promoter" ? "rgba(255,190,50,0.2)" : "rgba(50,200,255,0.15)")
              : (role === "promoter"
                ? "linear-gradient(135deg, #ffbe32, #ff9500)"
                : "linear-gradient(135deg, #32c8ff, #0096cc)"),
            border: "none", borderRadius: "4px",
            color: submitted ? (role === "promoter" ? "#ffbe32" : "#32c8ff") : "#0a0a0f",
            fontSize: "13px", letterSpacing: "3px",
            textTransform: "uppercase", cursor: "pointer",
            fontFamily: "'Georgia', serif", fontWeight: "700",
            transition: "all 0.3s ease",
            boxShadow: submitted ? "none" : (role === "promoter"
              ? "0 8px 32px rgba(255,190,50,0.25)"
              : "0 8px 32px rgba(50,200,255,0.2)"),
          }}>
            {submitted ? "✓ Account Created!" : `Register as ${role === "promoter" ? "Promoter" : "Business"}`}
          </button>

          {/* Login link */}
          <p style={{
            textAlign: "center", marginTop: "24px", marginBottom: 0,
            fontSize: "13px", color: "#444",
          }}>
            Already have an account?{" "}
            <span style={{
              color: role === "promoter" ? "#ffbe32" : "#32c8ff",
              cursor: "pointer", textDecoration: "underline",
              textUnderlineOffset: "3px",
            }}>
              Sign in
            </span>
          </p>
        </div>

        {/* Footer */}
        <p style={{
          textAlign: "center", marginTop: "24px",
          fontSize: "11px", color: "#333", letterSpacing: "1px",
        }}>
          ADMIN ACCOUNTS ARE CREATED BY INVITATION ONLY
        </p>
      </div>

      <style>{`
        @keyframes fadeSlideIn {
          from { opacity: 0; transform: translateY(8px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        input::placeholder { color: #333; }
        input:-webkit-autofill {
          -webkit-box-shadow: 0 0 0 30px #080810 inset !important;
          -webkit-text-fill-color: #f0ece0 !important;
        }
      `}</style>
    </div>
  );
}