/**
 * DeepSeek API Sandbox Testing Script
 * 
 * This script tests the DeepSeek API integration in sandbox mode
 * Run with: deno run --allow-net --allow-env test-deepseek-sandbox.ts
 */

const DEEPSEEK_API_KEY = 'sk-c20aba98ff9c42e8a57a54a392ca1df4'; // From .env
const API_URL = 'https://api.deepseek.com/v1/chat/completions';

interface TestResult {
  test: string;
  success: boolean;
  duration: number;
  tokens?: {
    prompt: number;
    completion: number;
    total: number;
  };
  cost?: number;
  error?: string;
}

const results: TestResult[] = [];

/**
 * Calculate cost in IDR
 */
function calculateCost(promptTokens: number, completionTokens: number): number {
  const USD_TO_IDR = 15000;
  const INPUT_COST = 0.28; // per 1M tokens
  const OUTPUT_COST = 0.42; // per 1M tokens
  
  // Assume 40% cache hit rate
  const cacheHitTokens = promptTokens * 0.4;
  const cacheMissTokens = promptTokens * 0.6;
  
  const inputCost = (cacheHitTokens / 1_000_000) * 0.028 + 
                    (cacheMissTokens / 1_000_000) * INPUT_COST;
  const outputCost = (completionTokens / 1_000_000) * OUTPUT_COST;
  
  return Math.ceil((inputCost + outputCost) * USD_TO_IDR);
}

/**
 * Test 1: Simple AI Chat
 */
async function testSimpleChat() {
  console.log('\n🧪 Test 1: Simple AI Chat (1 credit)');
  const startTime = Date.now();
  
  try {
    const response = await fetch(API_URL, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${DEEPSEEK_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'deepseek-chat',
        messages: [
          {
            role: 'system',
            content: 'You are a helpful assistant for Excel operations.',
          },
          {
            role: 'user',
            content: 'Sort column A in ascending order',
          },
        ],
        temperature: 0.3,
        response_format: { type: 'json_object' },
      }),
    });
    
    const duration = Date.now() - startTime;
    
    if (!response.ok) {
      throw new Error(`API error: ${response.status} ${await response.text()}`);
    }
    
    const data = await response.json();
    const cost = calculateCost(data.usage.prompt_tokens, data.usage.completion_tokens);
    
    console.log('✅ Success!');
    console.log(`   Duration: ${duration}ms`);
    console.log(`   Tokens: ${data.usage.total_tokens} (prompt: ${data.usage.prompt_tokens}, completion: ${data.usage.completion_tokens})`);
    console.log(`   Cost: IDR ${cost}`);
    console.log(`   Response: ${data.choices[0].message.content.substring(0, 100)}...`);
    
    results.push({
      test: 'Simple AI Chat',
      success: true,
      duration,
      tokens: {
        prompt: data.usage.prompt_tokens,
        completion: data.usage.completion_tokens,
        total: data.usage.total_tokens,
      },
      cost,
    });
  } catch (error) {
    console.log('❌ Failed:', error.message);
    results.push({
      test: 'Simple AI Chat',
      success: false,
      duration: Date.now() - startTime,
      error: error.message,
    });
  }
}

/**
 * Test 2: Complex Operation with Excel Context
 */
async function testComplexOperation() {
  console.log('\n🧪 Test 2: Complex Operation with Excel Context (2 credits)');
  const startTime = Date.now();
  
  const excelContext = `
CURRENT EXCEL FILE CONTEXT:
File: sales_data.xlsx
Sheet: Sheet1
Headers: Col0="Date", Col1="Product", Col2="Quantity", Col3="Price", Col4="Total"
Total Rows: 100
Sample Data:
Row 2: Col0="2024-01-01", Col1="Product A", Col2=10, Col3=100, Col4=1000
Row 3: Col0="2024-01-02", Col1="Product B", Col2=5, Col3=200, Col4=1000
Row 4: Col0="2024-01-03", Col1="Product A", Col2=15, Col3=100, Col4=1500
`;
  
  try {
    const response = await fetch(API_URL, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${DEEPSEEK_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'deepseek-chat',
        messages: [
          {
            role: 'system',
            content: 'You are an AI assistant specialized in Excel operations.' + excelContext,
          },
          {
            role: 'user',
            content: 'Create a pivot table showing total sales by product',
          },
        ],
        temperature: 0.3,
        response_format: { type: 'json_object' },
      }),
    });
    
    const duration = Date.now() - startTime;
    
    if (!response.ok) {
      throw new Error(`API error: ${response.status} ${await response.text()}`);
    }
    
    const data = await response.json();
    const cost = calculateCost(data.usage.prompt_tokens, data.usage.completion_tokens);
    
    console.log('✅ Success!');
    console.log(`   Duration: ${duration}ms`);
    console.log(`   Tokens: ${data.usage.total_tokens} (prompt: ${data.usage.prompt_tokens}, completion: ${data.usage.completion_tokens})`);
    console.log(`   Cost: IDR ${cost}`);
    console.log(`   Response: ${data.choices[0].message.content.substring(0, 100)}...`);
    
    results.push({
      test: 'Complex Operation',
      success: true,
      duration,
      tokens: {
        prompt: data.usage.prompt_tokens,
        completion: data.usage.completion_tokens,
        total: data.usage.total_tokens,
      },
      cost,
    });
  } catch (error) {
    console.log('❌ Failed:', error.message);
    results.push({
      test: 'Complex Operation',
      success: false,
      duration: Date.now() - startTime,
      error: error.message,
    });
  }
}

/**
 * Test 3: Streaming Response
 */
async function testStreaming() {
  console.log('\n🧪 Test 3: Streaming Response');
  const startTime = Date.now();
  
  try {
    const response = await fetch(API_URL, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${DEEPSEEK_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'deepseek-chat',
        messages: [
          {
            role: 'user',
            content: 'Explain how to use VLOOKUP in Excel in 2 sentences',
          },
        ],
        temperature: 0.3,
        stream: true,
      }),
    });
    
    if (!response.ok) {
      throw new Error(`API error: ${response.status}`);
    }
    
    console.log('✅ Streaming started...');
    
    const reader = response.body?.getReader();
    const decoder = new TextDecoder();
    let fullResponse = '';
    
    if (reader) {
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        
        const chunk = decoder.decode(value);
        const lines = chunk.split('\n').filter(line => line.trim() !== '');
        
        for (const line of lines) {
          if (line.startsWith('data: ')) {
            const data = line.slice(6);
            if (data === '[DONE]') continue;
            
            try {
              const parsed = JSON.parse(data);
              const content = parsed.choices[0]?.delta?.content || '';
              fullResponse += content;
              process.stdout.write(content);
            } catch (e) {
              // Skip invalid JSON
            }
          }
        }
      }
    }
    
    const duration = Date.now() - startTime;
    console.log(`\n   Duration: ${duration}ms`);
    console.log(`   Response length: ${fullResponse.length} characters`);
    
    results.push({
      test: 'Streaming Response',
      success: true,
      duration,
    });
  } catch (error) {
    console.log('❌ Failed:', error.message);
    results.push({
      test: 'Streaming Response',
      success: false,
      duration: Date.now() - startTime,
      error: error.message,
    });
  }
}

/**
 * Test 4: Cost Validation
 */
async function testCostValidation() {
  console.log('\n🧪 Test 4: Cost Validation (100 requests simulation)');
  
  const sampleCosts = results
    .filter(r => r.cost)
    .map(r => r.cost!);
  
  if (sampleCosts.length === 0) {
    console.log('⚠️  No cost data available from previous tests');
    return;
  }
  
  const avgCost = sampleCosts.reduce((a, b) => a + b, 0) / sampleCosts.length;
  const costFor100Requests = avgCost * 100;
  const costFor1000Requests = avgCost * 1000;
  
  console.log(`   Average cost per request: IDR ${Math.round(avgCost)}`);
  console.log(`   Cost for 100 requests: IDR ${Math.round(costFor100Requests)}`);
  console.log(`   Cost for 1,000 requests: IDR ${Math.round(costFor1000Requests)}`);
  
  // Validate against our projections
  const projectedCostPerCredit = 3; // IDR 3 per credit
  const actualCostPerCredit = avgCost;
  
  console.log(`\n   📊 Cost Analysis:`);
  console.log(`   Projected: IDR ${projectedCostPerCredit} per credit`);
  console.log(`   Actual: IDR ${Math.round(actualCostPerCredit)} per credit`);
  
  if (actualCostPerCredit <= projectedCostPerCredit * 1.2) {
    console.log(`   ✅ Within budget (${Math.round((actualCostPerCredit / projectedCostPerCredit) * 100)}% of projection)`);
  } else {
    console.log(`   ⚠️  Over budget (${Math.round((actualCostPerCredit / projectedCostPerCredit) * 100)}% of projection)`);
  }
  
  results.push({
    test: 'Cost Validation',
    success: actualCostPerCredit <= projectedCostPerCredit * 1.2,
    duration: 0,
    cost: Math.round(avgCost),
  });
}

/**
 * Print summary
 */
function printSummary() {
  console.log('\n' + '='.repeat(60));
  console.log('📊 TEST SUMMARY');
  console.log('='.repeat(60));
  
  const passed = results.filter(r => r.success).length;
  const failed = results.filter(r => !r.success).length;
  
  console.log(`\nTotal Tests: ${results.length}`);
  console.log(`✅ Passed: ${passed}`);
  console.log(`❌ Failed: ${failed}`);
  
  if (failed === 0) {
    console.log('\n🎉 All tests passed!');
  } else {
    console.log('\n⚠️  Some tests failed. Check details above.');
  }
  
  // Cost summary
  const totalCost = results.reduce((sum, r) => sum + (r.cost || 0), 0);
  const avgDuration = results.reduce((sum, r) => sum + r.duration, 0) / results.length;
  
  console.log(`\n💰 Cost Summary:`);
  console.log(`   Total cost: IDR ${totalCost}`);
  console.log(`   Average duration: ${Math.round(avgDuration)}ms`);
  
  console.log('\n' + '='.repeat(60));
}

/**
 * Main test runner
 */
async function runTests() {
  console.log('🚀 Starting DeepSeek API Sandbox Tests');
  console.log('API Key:', DEEPSEEK_API_KEY.substring(0, 10) + '...');
  
  await testSimpleChat();
  await testComplexOperation();
  await testStreaming();
  await testCostValidation();
  
  printSummary();
}

// Run tests
runTests().catch(console.error);
