/**
 * Material Symbols Outlined icon wrapper.
 *
 * Usage:
 *   <Icon name="home" />
 *   <Icon name="shopping_cart" className="text-primary" size={20} />
 *   <Icon name="favorite" filled />
 */
interface IconProps {
  name: string;
  size?: number;
  filled?: boolean;
  className?: string;
  style?: React.CSSProperties;
}

export function Icon({
  name,
  size = 24,
  filled = false,
  className = "",
  style,
}: IconProps) {
  return (
    <span
      className={`material-symbols-outlined ${className}`}
      style={{ fontSize: size, ...style }}
      aria-hidden="true"
    >
      {name}
    </span>
  );
}

/**
 * Common icon names for JagoFarm (keeps imports consistent):
 *
 * Navigation: home, search, shopping_cart, person, menu, arrow_back, arrow_forward, close, expand_more, chevron_right, chevron_left
 * Products: inventory_2, category, star, favorite, share, filter_list, sort, view_module, view_list
 * Orders: receipt_long, local_shipping, check_circle, pending, cancel, schedule, track_changes
 * Payment: payments, credit_card, account_balance, qr_code, wallet
 * Admin: dashboard, people, bar_chart, settings, edit, delete, add, upload_file, discount
 * General: location_on, phone, email, info, help, warning, check, error, language, calendar_today
 */