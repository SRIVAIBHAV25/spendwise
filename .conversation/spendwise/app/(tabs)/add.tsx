import { Redirect } from 'expo-router';

/**
 * Placeholder route that reserves the middle slot of the tab bar for the
 * floating add button. Pressing the button opens the add-expense screen, so
 * this route is only reached by a direct link — send those straight there too.
 */
export default function AddTabRedirect() {
  return <Redirect href="/expense/new" />;
}
