import React, { useState } from "react";
import { Form, FormGroup, Label, Input, Button } from "reactstrap";
import "./refundForm.css";
import ConfirmModal from "../UI/ConfirmModal";

const CancelOrderForm = ({ orderId, subOrder, onCancelOrder, onCancel, loading }) => {
    const [reason, setReason] = useState("");
    const [showConfirmModal, setShowConfirmModal] = useState(false);

    const handleSubmit = (e) => {
        e.preventDefault();
        setShowConfirmModal(true);
    };

    const handleConfirm = () => {
        setShowConfirmModal(false);
        onCancelOrder({ reason });
    };

    return (
        <>
            <div className="order-details mb-4">
                <h6 className="fw-bold">Order Detail</h6>
                <p><strong>Order ID:</strong> {subOrder.id}</p>
                <p><strong>Seller:</strong> {subOrder.sellerName || "Unknown Store"}</p>
                <div className="suborder-items">
                    {subOrder.items.map((item, index) => (
                        <div key={index} className="suborder-item">
                            <img src={item.imgUrl} alt={item.productName} className="suborder-item-img" />
                            <div className="suborder-item-info">
                                <p><strong>Product:</strong> {item.productName}</p>
                                <p><strong>Quantity:</strong> {item.quantity}</p>
                                <p><strong>Price:</strong> ${item.price}</p>
                            </div>
                        </div>
                    ))}
                </div>
            </div>

            <Form onSubmit={handleSubmit} className="refund-form">
                <h6 className="fw-bold">Cancel Order</h6>
                <FormGroup>
                    <Label for="reason">Reason for Cancellation:</Label>
                    <Input
                        type="select"
                        id="reason"
                        value={reason}
                        onChange={(e) => setReason(e.target.value)}
                        required
                    >
                        <option value="">Select a reason</option>
                        <option value="Changed my mind">Changed my mind</option>
                        <option value="Incorrect product information">Incorrect product information</option>
                        <option value="Change shipping address">Change shipping address</option>
                        <option value="Other">Other...</option>
                    </Input>
                </FormGroup>
                {reason === "Other" && (
                    <FormGroup>
                        <Label for="customReason">Other Reason:</Label>
                        <Input
                            type="textarea"
                            id="customReason"
                            value={reason === "Other" ? reason : ""}
                            onChange={(e) => setReason(e.target.value)}
                            required
                        />
                    </FormGroup>
                )}
                <div className="d-flex justify-content-end gap-2">
                    <Button
                        color="secondary"
                        onClick={onCancel}
                        disabled={loading}
                        className="form-btn"
                    >
                        Cancel
                    </Button>
                    <Button
                        color="primary"
                        type="submit"
                        disabled={loading}
                        className="form-btn"
                    >
                        {loading ? "Processing..." : "Submit Request"}
                    </Button>
                </div>
            </Form>

            <ConfirmModal
                isOpen={showConfirmModal}
                onClose={() => setShowConfirmModal(false)}
                onConfirm={handleConfirm}
                message="Are you sure you want to cancel this order?"
            />
        </>
    );
};

export default CancelOrderForm;