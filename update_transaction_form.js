const fs = require('fs');
const filePath = 'apps/web/components/TransactionForm.js';
let content = fs.readFileSync(filePath, 'utf8');

const startIdx = content.indexOf('  return (');
const oldReturn = content.substring(startIdx);

const newReturn = `  return (
    <Card className="border-white/20 bg-black/60 backdrop-blur-md rounded-none">
      <CardHeader className="border-b border-white/20 bg-white/5 pb-3">
        <CardTitle className="text-xl font-mono uppercase tracking-widest text-white">Send XRP</CardTitle>
        <CardDescription className="text-slate-400 font-mono text-xs">Transfer XRP to another address</CardDescription>
      </CardHeader>

      <CardContent className="pt-6">
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="destination" className="text-white/70 font-mono text-xs uppercase">Destination Address</Label>
            <Input
              id="destination"
              type="text"
              placeholder="rN7n7otQDd6FczFgLdlqtyMVrn3HMfXoQT"
              value={destination}
              onChange={(e) => setDestination(e.target.value)}
              required
              className="rounded-none bg-black border-white/30 text-white font-mono placeholder:text-white/20 text-xs md:text-sm"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="amount" className="text-white/70 font-mono text-xs uppercase">Amount (drops)</Label>
            <Input
              id="amount"
              type="number"
              placeholder="1000000"
              min="1"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              required
              className="rounded-none bg-black border-white/30 text-white font-mono text-xs md:text-sm"
            />
            <p className="text-xs font-mono text-white/40">1 XRP = 1,000,000 drops</p>
          </div>

          <Button type="submit" disabled={isLoading} className="w-full rounded-none bg-white text-black hover:bg-slate-200 font-mono font-bold mt-4 tracking-widest">
            {isLoading ? "SUBMITTING..." : "SIGN & SUBMIT"}
          </Button>
        </form>

        {result && (
          <Alert className={\`rounded-none mt-4 font-mono \${result.success ? "border-green-500/50 bg-green-500/10 text-green-400" : "border-red-500/50 bg-red-500/10 text-red-400"}\`}>
            {result.success ? (
              <CheckCircle2 className="h-4 w-4 text-green-400" />
            ) : (
              <XCircle className="h-4 w-4 text-red-400" />
            )}
            <AlertTitle className="ml-2">{result.success ? "TRANSACTION SUBMITTED" : "TRANSACTION FAILED"}</AlertTitle>
            <AlertDescription className="ml-2 text-xs mt-2 text-white/70">
              {result.success ? (
                <div className="space-y-1">
                  <p className="font-mono break-all text-xs">Hash: {result.hash}</p>
                  {result.id && <p className="text-xs">ID: {result.id}</p>}
                </div>
              ) : (
                <p>{result.error}</p>
              )}
            </AlertDescription>
          </Alert>
        )}
      </CardContent>
    </Card>
  );
}
`;

const updatedContent = content.substring(0, startIdx) + newReturn;
fs.writeFileSync(filePath, updatedContent);
console.log("Updated TransactionForm.js");
