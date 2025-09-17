import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import "./Browserdetails.css";
import bowserImage from "./Bowser.jpg"; // Ensure this exists
import Header from "../../Components/Header";
import Footer from "../../Components/Footer";

const fuelTypes = [
  "Lanka Petrol 92 Octane",
  "Lanka Petrol 95 Octane",
  "Lanka Auto Diesel",
  "Lanka Super Diesel",
];

const Browserdetails = () => {
  const navigate = useNavigate();
  const [rows, setRows] = useState([
    {
      date: "",
      invoiceNo: "",
      browserNo: "",
      product: "",
      quantity: "",
      sealNo: "",
      driverCheck: "Pending",
      dealerCheck: "Pending",
    },
  ]);
  const [errors, setErrors] = useState([]);
  const [submitStatus, setSubmitStatus] = useState(null);
  const [history, setHistory] = useState([]);
  const [showHistory, setShowHistory] = useState(false);

  // Fetch history
  useEffect(() => {
    const fetchHistory = async () => {
      try {
        const response = await fetch("http://localhost:5000/api/browser-details/");
        const result = await response.json();
        if (response.ok) {
          setHistory(
            Array.isArray(result?.data)
              ? result.data
              : Array.isArray(result)
              ? result
              : []
          );
        } else {
          setSubmitStatus({ type: "error", message: result.message || "Error fetching history." });
          setHistory([]);
        }
      } catch (error) {
        console.error("Network error fetching history:", error);
        setSubmitStatus({ type: "error", message: "Network error fetching history." });
        setHistory([]);
      }
    };
    fetchHistory();
  }, []);

  const validateRow = (row) => {
    const rowErrors = {};
    if (!row.date) rowErrors.date = "Date is required";
    if (!row.invoiceNo) rowErrors.invoiceNo = "Invoice No. is required";
    if (!row.browserNo) rowErrors.browserNo = "Bowser No. is required";
    if (!row.product) rowErrors.product = "Product is required";
    if (row.quantity === "" || Number(row.quantity) <= 0)
      rowErrors.quantity = "Valid quantity is required";
    if (!row.sealNo) rowErrors.sealNo = "Seal No. is required";
    return rowErrors;
  };

  // ✅ fixed: no double-set & proper number handling for quantity
  const handleInputChange = (index, field, value) => {
    const updatedRows = rows.map((r, i) =>
      i === index
        ? {
            ...r,
            [field]: field === "quantity" ? (value === "" ? "" : Number(value)) : value,
          }
        : r
    );
    setRows(updatedRows);

    const updatedErrs = [...errors];
    updatedErrs[index] = validateRow(updatedRows[index]);
    setErrors(updatedErrs);
  };

  const toggleCheck = (index, field) => {
    const updatedRows = rows.map((r, i) =>
      i === index ? { ...r, [field]: r[field] === "Pending" ? "Checked" : "Pending" } : r
    );
    setRows(updatedRows);
  };

  const addNewRow = () => {
    const newRow = {
      date: "",
      invoiceNo: "",
      browserNo: "",
      product: "",
      quantity: "",
      sealNo: "",
      driverCheck: "Pending",
      dealerCheck: "Pending",
    };
    const rowErrors = validateRow(newRow);
    if (
      Object.keys(rowErrors).length === 0 ||
      window.confirm("Some fields are empty. Add new row anyway?")
    ) {
      setRows([...rows, newRow]);
      setErrors([...errors, rowErrors]);
    }
  };

  const deleteRow = (index) => {
    if (window.confirm("Are you sure you want to delete this row?")) {
      setRows(rows.filter((_, i) => i !== index));
      setErrors(errors.filter((_, i) => i !== index));
    }
  };

  const handleSubmit = async () => {
    const allErrors = rows.map((row) => validateRow(row));
    setErrors(allErrors);

    if (allErrors.some((err) => Object.keys(err).length > 0)) {
      setSubmitStatus({ type: "error", message: "Please fix all errors before submitting." });
      return;
    }

    try {
      const response = await fetch("http://localhost:5000/api/browser-details", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(rows),
      });

      const result = await response.json();
      if (response.ok) {
        setSubmitStatus({ type: "success", message: "Data saved successfully!" });
        setTimeout(() => setSubmitStatus(null), 4000);

        // refresh history
        const historyResponse = await fetch("http://localhost:5000/api/browser-details");
        const historyResult = await historyResponse.json();
        if (historyResponse.ok) {
          setHistory(
            Array.isArray(historyResult?.data)
              ? historyResult.data
              : Array.isArray(historyResult)
              ? historyResult
              : []
          );
        } else {
          setSubmitStatus({
            type: "error",
            message: historyResult.message || "Error fetching history after submit.",
          });
        }

        // reset form
        setRows([
          {
            date: "",
            invoiceNo: "",
            browserNo: "",
            product: "",
            quantity: "",
            sealNo: "",
            driverCheck: "Pending",
            dealerCheck: "Pending",
          },
        ]);
        setErrors([]);
      } else {
        setSubmitStatus({ type: "error", message: result.message || "Error saving data." });
      }
    } catch (error) {
      console.error("Network error submitting data:", error);
      setSubmitStatus({ type: "error", message: "Network error. Please try again." });
    }
  };

  const toggleHistory = () => setShowHistory((prev) => !prev);

  return (
    <div className="browser-details">
      <Header />
      <div className="browser-details-container">
        <div className="header-section">
          <h1 className="title">Bowser Details</h1>
          <img src={bowserImage} alt="Fuel Bowser" className="fuel-tank-image" />
        </div>

        {submitStatus && (
          <div className={`submit-message ${submitStatus.type}`}>
            {submitStatus.message}
          </div>
        )}

        {errors.some((err) => Object.keys(err || {}).length > 0) && (
          <div className="error-message">
            Please fill all required fields correctly before proceeding.
          </div>
        )}

        <div className="table-container">
          <table>
            <thead>
              <tr>
                <th>Date</th>
                <th>Invoice No.</th>
                <th>Bowser No.</th>
                <th>Product</th>
                <th>Quantity (L)</th>
                <th>Seal No.</th>
                <th>Driver Check</th>
                <th>Dealer Check</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((row, index) => (
                <tr key={index}>
                  <td>
                    <input
                      type="date"
                      value={row.date}
                      onChange={(e) => handleInputChange(index, "date", e.target.value)}
                      className={errors[index]?.date ? "input-error" : ""}
                      title={errors[index]?.date || ""}
                    />
                  </td>
                  <td>
                    <input
                      type="text"
                      value={row.invoiceNo}
                      onChange={(e) => handleInputChange(index, "invoiceNo", e.target.value)}
                      className={errors[index]?.invoiceNo ? "input-error" : ""}
                      title={errors[index]?.invoiceNo || ""}
                    />
                  </td>
                  <td>
                    <input
                      type="text"
                      value={row.browserNo}
                      onChange={(e) => handleInputChange(index, "browserNo", e.target.value)}
                      className={errors[index]?.browserNo ? "input-error" : ""}
                      title={errors[index]?.browserNo || ""}
                    />
                  </td>
                  <td>
                    <select
                      value={row.product}
                      onChange={(e) => handleInputChange(index, "product", e.target.value)}
                      className={errors[index]?.product ? "input-error" : ""}
                      title={errors[index]?.product || ""}
                    >
                      <option value="">Select Product</option>
                      {fuelTypes.map((type) => (
                        <option key={type} value={type}>{type}</option>
                      ))}
                    </select>
                  </td>
                  <td>
                    <input
                      type="number"
                      inputMode="decimal"
                      value={row.quantity}
                      onChange={(e) => handleInputChange(index, "quantity", e.target.value)}
                      min="0"
                      className={errors[index]?.quantity ? "input-error" : ""}
                      title={errors[index]?.quantity || ""}
                    />
                  </td>
                  <td>
                    <input
                      type="text"
                      value={row.sealNo}
                      onChange={(e) => handleInputChange(index, "sealNo", e.target.value)}
                      className={errors[index]?.sealNo ? "input-error" : ""}
                      title={errors[index]?.sealNo || ""}
                    />
                  </td>
                  <td>
                    <button
                      className={row.driverCheck === "Pending" ? "pending-btn" : "checked-btn"}
                      onClick={() => toggleCheck(index, "driverCheck")}
                      title={row.driverCheck === "Pending" ? "Mark as Checked" : "Mark as Pending"}
                    >
                      {row.driverCheck === "Pending" ? "⏳ Pending" : "✔ Checked"}
                    </button>
                  </td>
                  <td>
                    <button
                      className={row.dealerCheck === "Pending" ? "pending-btn" : "checked-btn"}
                      onClick={() => toggleCheck(index, "dealerCheck")}
                      title={row.dealerCheck === "Pending" ? "Mark as Checked" : "Mark as Pending"}
                    >
                      {row.dealerCheck === "Pending" ? "⏳ Pending" : "✔ Checked"}
                    </button>
                  </td>
                  <td>
                    <button className="delete-btn" onClick={() => deleteRow(index)} title="Delete Row">
                      🗑
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {showHistory && (
          <div className="history-modal">
            <div className="history-content">
              <div className="history-header">
                <h2 className="history--Topic">Bowser Details History</h2>
                <button
                  className="close--btn"
                  onClick={toggleHistory}
                  title="Close history"
                >
                  ✕
                </button>
              </div>
              <div className="history-table-container">
                {history.length === 0 ? (
                  <p>No history available.</p>
                ) : (
                  <table>
                    <thead>
                      <tr>
                        <th>Date</th>
                        <th>Invoice No.</th>
                        <th>Bowser No.</th>
                        <th>Product</th>
                        <th>Quantity (L)</th>
                        <th>Seal No.</th>
                        <th>Driver Check</th>
                        <th>Dealer Check</th>
                        <th>Created At</th>
                      </tr>
                    </thead>
                    <tbody>
                      {history.map((item, index) => (
                        <tr key={index}>
                          <td>{item.date}</td>
                          <td>{item.invoiceNo}</td>
                          <td>{item.browserNo}</td>
                          <td>{item.product}</td>
                          <td>{item.quantity}</td>
                          <td>{item.sealNo}</td>
                          <td>{item.driverCheck}</td>
                          <td>{item.dealerCheck}</td>
                          <td>{new Date(item.createdAt).toLocaleString()}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                )}
              </div>
            </div>
          </div>
        )}

        <div className="button-container">
          <button className="add-new-btn" onClick={addNewRow} title="Add a new row">
            + Add New Row
          </button>
          <button className="history-btn" onClick={toggleHistory} title="Show history">
            {showHistory ? "Hide History" : "Show History"}
          </button>
          <button className="submit-btn" onClick={handleSubmit} title="Submit all data">
            Submit Data
          </button>
        </div>
      </div>
      <Footer />
    </div>
  );
};

export default Browserdetails;
