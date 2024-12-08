import "./monthlySpending.css"
/**
 * Displays the monthly spending. Including:
 * - The total budget for the month
 * - The total spending
 * - Amount left in budget
 */
export default function () {
  return (
    <>
      <div class="container">
        <p>Remaining:</p>
        {
          // TODO: color should be dynamic, based on the percentage of month left
        }
        <h1 style="color: green">$100</h1>
        <h1>/$2000</h1>
      </div>
    </>
  );
}
