const STATUS_CONFIG = {
  'Pending': { color: 'neutral', label: 'Pending', dotColor: '#8492a6' },
  'Order Confirmed': { color: 'info', label: 'Order Confirmed', dotColor: '#4fa3d9' },
  'Awaiting Pickup': { color: 'info', label: 'Awaiting Pickup', dotColor: '#4fa3d9' },
  'Picked Up': { color: 'teal', label: 'Picked Up', dotColor: '#3bb8c9' },
  'In Transit': { color: 'teal', label: 'In Transit', dotColor: '#3bb8c9', pulse: true },
  'On Hold': { color: 'warning', label: 'On Hold', dotColor: '#e09a28' },
  'Arrived at Facility': { color: 'teal', label: 'At Facility', dotColor: '#3bb8c9' },
  'Customs Clearance in Progress': { color: 'warning', label: 'Customs Clearance', dotColor: '#e09a28', pulse: true },
  'Held at Customs': { color: 'warning', label: 'Held at Customs', dotColor: '#e09a28' },
  'Out for Delivery': { color: 'success', label: 'Out for Delivery', dotColor: '#3c9e58', pulse: true },
  'Delivery Attempted': { color: 'warning', label: 'Delivery Attempted', dotColor: '#e09a28' },
  'Delivered': { color: 'success', label: 'Delivered', dotColor: '#3c9e58' },
  'Delayed': { color: 'warning', label: 'Delayed', dotColor: '#e09a28' },
  'Exception': { color: 'error', label: 'Exception', dotColor: '#c94040', pulse: true },
  'Returned to Sender': { color: 'error', label: 'Returned', dotColor: '#c94040' },
  'Cancelled': { color: 'error', label: 'Cancelled', dotColor: '#c94040' },
};

export default function StatusBadge({ status, showDot = true, size = 'normal' }) {
  const config = STATUS_CONFIG[status] || { color: 'neutral', label: status, dotColor: '#8492a6' };
  const sizeClass = size === 'sm' ? ' badge-sm' : size === 'lg' ? ' badge-lg' : '';

  return (
    <span className={`badge badge-${config.color}${sizeClass}`} title={status}>
      {showDot && (
        <span
          style={{
            width: 7,
            height: 7,
            borderRadius: '50%',
            background: config.dotColor,
            flexShrink: 0,
            animation: config.pulse ? 'pulseDot 2s ease-in-out infinite' : 'none',
          }}
        />
      )}
      {config.label}
    </span>
  );
}

export { STATUS_CONFIG };
