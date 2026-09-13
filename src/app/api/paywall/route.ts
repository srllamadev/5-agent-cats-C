import { NextResponse } from 'next/server';
import { JsonRpcProvider } from 'ethers';

const CONTRACT_ADDRESS = '0x162A23eF87a8B99D42606Fb077BdE490FCAC5496';
const RPC_URL = 'https://api.avax-test.network/ext/bc/C/rpc'; // Fuji Testnet

export async function GET(request: Request) {
  const authHeader = request.headers.get('Authorization');
  
  if (!authHeader || !authHeader.startsWith('L402 ')) {
    return NextResponse.json(
      { 
        error: 'Payment Required', 
        contractAddress: CONTRACT_ADDRESS,
        price: '0.001', // AVAX
        network: 'Avalanche Fuji Testnet'
      }, 
      { status: 402 }
    );
  }

  const txHash = authHeader.replace('L402 ', '');

  try {
    const provider = new JsonRpcProvider(RPC_URL);
    const tx = await provider.getTransaction(txHash);
    const receipt = await provider.getTransactionReceipt(txHash);

    if (!tx || !receipt) {
      return NextResponse.json({ error: 'Transaction not found or pending' }, { status: 400 });
    }

    if (receipt.status !== 1) {
      return NextResponse.json({ error: 'Transaction failed on chain' }, { status: 400 });
    }

    // Optional: verify the recipient is our contract
    // if (tx.to?.toLowerCase() !== CONTRACT_ADDRESS.toLowerCase()) {
    //   return NextResponse.json({ error: 'Transaction was not sent to the paywall contract' }, { status: 400 });
    // }

    // Check if the value is at least 0.001 AVAX (1000000000000000 wei)
    if (tx.value < 1000000000000000n) {
      return NextResponse.json({ error: 'Insufficient payment amount' }, { status: 400 });
    }

    return NextResponse.json({ success: true, message: 'Payment verified, audit authorized' });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
