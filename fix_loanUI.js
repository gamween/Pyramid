const fs = require('fs');

let ui = fs.readFileSync('apps/web/components/LoanInteraction.js', 'utf8');

// Replace mock with hook
ui = ui.replace(
  'import { useWallet } from "./providers/WalletProvider";',
  'import { useWallet } from "./providers/WalletProvider";\nimport { useLoan } from "../hooks/useLoan";'
);

ui = ui.replace(
  'const { walletManager, isConnected, showStatus } = useWallet();',
  'const { walletManager, isConnected, showStatus } = useWallet();\n  const { createLoan, payLoan, isLoading } = useLoan();'
);

// Update handleSubmit replacing the try-catch block
const oldSubmitBlock = `      // Mock logic as the actual hook is currently empty or just to match the visual UI step
      setTimeout(() => {
        setResult({
          success: true,
          hash: "MOCK_HASH_" + Math.random().toString(36).substring(7).toUpperCase(),
          action: action
        });
        showStatus(\`Successfully executed \${action} via Loan Broker!\`, "success");
        setIsSubmitting(false);
      }, 1000);`;

const newSubmitBlock = `      let response;
      if (action === "BORROW") {
        response = await createLoan(loanBrokerId, principal);
      } else {
        response = await payLoan(loanId, repayAmount, isFullRepay);
      }
      
      setResult({
        success: true,
        hash: response.tx ? response.tx.hash : "MOCK_HASH",
        action: action
      });
      setIsSubmitting(false);`;

ui = ui.replace(oldSubmitBlock, newSubmitBlock);

fs.writeFileSync('apps/web/components/LoanInteraction.js', ui, 'utf8');
console.log('Fixed LoanInteraction.js to use useLoan hook');
