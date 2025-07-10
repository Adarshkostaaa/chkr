<?php
set_time_limit(0);
session_start();

// Turn off output buffering
@ob_end_flush();
@ini_set('output_buffering', 'off');
@ini_set('zlib.output_compression', false);
@ini_set('implicit_flush', true);
while (ob_get_level()) ob_end_clean();
ob_implicit_flush(true);

// Authentication check
if (!isset($_SESSION['authenticated'])) {
    if (isset($_POST['password'])) {
        $entered_password = $_POST['password'];
        if ($entered_password === 'config_mere_papa') {
            $_SESSION['authenticated'] = true;
        } else {
            echo json_encode(['error' => 'Incorrect password']);
            exit;
        }
    } else {
        include 'login.html';
        exit;
    }
}

// Include the checker logic if cards are submitted
if (isset($_POST['cc_input'])) {
    include 'checker.php';
    exit;
}

// Show main interface
include 'interface.html';
?>