import React, { useState } from "react";
import { Form, FormGroup, Label, Input, Button } from "reactstrap";
import "./refundForm.css";
import ConfirmModal from "../UI/ConfirmModal";
import { toast } from "react-toastify";

const CancelOrderForm = ({
    orderId,
    subOrder,
    item,
    selectedQuantity,
    setSelectedQuantity,
    onCancelOrder,
    onCancel,
    loading,
}) => {
    const [reason, setReason] = useState("");
    const [customReason, setCustomReason] = useState("");
    const [showConfirmModal, setShowConfirmModal] = useState(false);

    const handleSubmit = (e) => {
        e.preventDefault();
        if (!item) {
            toast.warning("No item selected for cancellation!");
            return;
        }
        setShowConfirmModal(true);
    };

    const handleConfirm = () => {
        setShowConfirmModal(false);
        const finalReason = reason === "Other" ? customReason : reason;
        if (!finalReason) {
            toast.error("Please select or enter a reason for cancellation");
            return;
        }
        onCancelOrder({
            reason: finalReason,
            itemId: item.id,
            quantity: parseInt(selectedQuantity),
            subOrderId: subOrder.id,
        });
    };

    return (
        <>
            <div className="order-details mb-4">
                <h6 className="fw-bold">Order Detail</h6>
                <p>
                    <strong>Order ID:</strong> {subOrder.id}
                </p>
                <p>
                    <strong>Seller:</strong>{" "}
                    {subOrder.sellerName || "Unknown Store"}
                </p>
                {item && (
                    <div className="suborder-items">
                        <div className="suborder-item">
                            <img
                                src={item.imgUrl}
                                alt={item.productName}
                                className="suborder-item-img"
                            />
                            <div className="suborder-item-info">
                                <p>
                                    <strong>Product:</strong> {item.productName}
                                </p>
                                <p>
                                    <strong>Quantity:</strong> {item.quantity}
                                </p>
                                <p>
                                    <strong>Price:</strong> ${item.price * item.quantity}
                                </p>
                            </div>
                        </div>
                    </div>
                )}
            </div>

            <Form onSubmit={handleSubmit} className="refund-form">
                <h6 className="fw-bold">Cancel Item</h6>
                {item && (
                    <FormGroup>
                        <Label for="quantity">
                            Quantity to Cancel (Max: {item.quantity}):
                        </Label>
                        <Input
                            type="number"
                            id="quantity"
                            min="1"
                            max={item.quantity}
                            value={selectedQuantity}
                            onChange={(e) =>
                                setSelectedQuantity(e.target.value)
                            }
                            required
                        />
                    </FormGroup>
                )}
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
                        <option value="Incorrect product information">
                            Incorrect product information
                        </option>
                        <option value="Change shipping address">
                            Change shipping address
                        </option>
                        <option value="Other">Other</option>
                    </Input>
                </FormGroup>
                {reason === "Other" && (
                    <FormGroup>
                        <Label for="customReason">Other Reason:</Label>
                        <Input
                            type="textarea"
                            id="customReason"
                            value={customReason}
                            onChange={(e) => setCustomReason(e.target.value)}
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
                        disabled={loading || !item}
                        className="form-btn"
                    >
                        {loading ? "Processing..." : "Submit Cancellation"}
                    </Button>
                </div>
            </Form>

            <ConfirmModal
                isOpen={showConfirmModal}
                onClose={() => setShowConfirmModal(false)}
                onConfirm={handleConfirm}
                message={`Are you sure you want to cancel ${selectedQuantity} of ${item?.productName}?`}
            />
        </>
    );
};

export default CancelOrderForm;
