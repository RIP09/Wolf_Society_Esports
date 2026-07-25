<?php
// api.php – Complete REST API for Wolf Society Esports
// ============================================================

// CORS headers
header('Access-Control-Allow-Origin: https://wolfsocietygg.vercel.app'); // Change to your Vercel domain
header('Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type, Authorization');
header('Content-Type: application/json');

// Handle preflight requests
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit;
}

// Database configuration – CHANGE THESE
$host = 'localhost';
$dbname = 'YOUR_DATABASE_NAME';
$username = 'YOUR_DB_USERNAME';
$password = 'YOUR_DB_PASSWORD';

try {
    $pdo = new PDO("mysql:host=$host;dbname=$dbname;charset=utf8", $username, $password);
    $pdo->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);
} catch (PDOException $e) {
    http_response_code(500);
    echo json_encode(['error' => 'Database connection failed: ' . $e->getMessage()]);
    exit;
}

// Start session for authentication
session_start();

// --- Helper function for CRUD ---
function handleCrud($table, $method, $id = null) {
    global $pdo;

    switch ($method) {
        case 'GET':
            if ($id) {
                $stmt = $pdo->prepare("SELECT * FROM $table WHERE id = ?");
                $stmt->execute([$id]);
                $result = $stmt->fetch(PDO::FETCH_ASSOC);
                if ($result) {
                    echo json_encode($result);
                } else {
                    http_response_code(404);
                    echo json_encode(['error' => 'Record not found']);
                }
            } else {
                $stmt = $pdo->query("SELECT * FROM $table ORDER BY id DESC");
                echo json_encode($stmt->fetchAll(PDO::FETCH_ASSOC));
            }
            break;

        case 'POST':
            $data = json_decode(file_get_contents('php://input'), true);
            if (!$data) {
                http_response_code(400);
                echo json_encode(['error' => 'Invalid JSON']);
                return;
            }
            $columns = array_keys($data);
            $placeholders = implode(',', array_fill(0, count($columns), '?'));
            $sql = "INSERT INTO $table (" . implode(',', $columns) . ") VALUES ($placeholders)";
            $stmt = $pdo->prepare($sql);
            try {
                $stmt->execute(array_values($data));
                echo json_encode(['success' => true, 'id' => $pdo->lastInsertId()]);
            } catch (PDOException $e) {
                http_response_code(400);
                echo json_encode(['error' => $e->getMessage()]);
            }
            break;

        case 'PUT':
            if (!$id) {
                http_response_code(400);
                echo json_encode(['error' => 'ID required']);
                return;
            }
            $data = json_decode(file_get_contents('php://input'), true);
            if (!$data) {
                http_response_code(400);
                echo json_encode(['error' => 'Invalid JSON']);
                return;
            }
            $sets = [];
            $values = [];
            foreach ($data as $key => $val) {
                $sets[] = "$key = ?";
                $values[] = $val;
            }
            $values[] = $id;
            $sql = "UPDATE $table SET " . implode(',', $sets) . " WHERE id = ?";
            $stmt = $pdo->prepare($sql);
            try {
                $stmt->execute($values);
                echo json_encode(['success' => true]);
            } catch (PDOException $e) {
                http_response_code(400);
                echo json_encode(['error' => $e->getMessage()]);
            }
            break;

        case 'DELETE':
            if (!$id) {
                http_response_code(400);
                echo json_encode(['error' => 'ID required']);
                return;
            }
            $stmt = $pdo->prepare("DELETE FROM $table WHERE id = ?");
            try {
                $stmt->execute([$id]);
                if ($stmt->rowCount() > 0) {
                    echo json_encode(['success' => true]);
                } else {
                    http_response_code(404);
                    echo json_encode(['error' => 'Record not found']);
                }
            } catch (PDOException $e) {
                http_response_code(400);
                echo json_encode(['error' => $e->getMessage()]);
            }
            break;

        default:
            http_response_code(405);
            echo json_encode(['error' => 'Method not allowed']);
            break;
    }
}

// --- Router ---
$path = explode('/', trim($_SERVER['PATH_INFO'] ?? '/', '/'));
$resource = $path[0] ?? '';
$id = $path[1] ?? null;
$method = $_SERVER['REQUEST_METHOD'];

switch ($resource) {
    case 'auth':
        if ($method === 'POST') {
            $action = $_GET['action'] ?? '';
            if ($action === 'login') {
                // Login
                $data = json_decode(file_get_contents('php://input'), true);
                if (!isset($data['email']) || !isset($data['password'])) {
                    http_response_code(400);
                    echo json_encode(['error' => 'Email and password required']);
                    exit;
                }
                $stmt = $pdo->prepare("SELECT * FROM users WHERE email = ?");
                $stmt->execute([$data['email']]);
                $user = $stmt->fetch(PDO::FETCH_ASSOC);
                if ($user && password_verify($data['password'], $user['password'])) {
                    $_SESSION['user_id'] = $user['id'];
                    $_SESSION['role'] = $user['role'];
                    echo json_encode([
                        'success' => true,
                        'user' => [
                            'id' => $user['id'],
                            'name' => $user['name'],
                            'email' => $user['email'],
                            'role' => $user['role']
                        ]
                    ]);
                } else {
                    http_response_code(401);
                    echo json_encode(['error' => 'Invalid credentials']);
                }
            } elseif ($action === 'register') {
                // Register
                $data = json_decode(file_get_contents('php://input'), true);
                if (!isset($data['email']) || !isset($data['password']) || !isset($data['name'])) {
                    http_response_code(400);
                    echo json_encode(['error' => 'Email, password, and name required']);
                    exit;
                }
                // Check if email exists
                $stmt = $pdo->prepare("SELECT id FROM users WHERE email = ?");
                $stmt->execute([$data['email']]);
                if ($stmt->fetch()) {
                    http_response_code(409);
                    echo json_encode(['error' => 'Email already registered']);
                    exit;
                }
                $hashed = password_hash($data['password'], PASSWORD_DEFAULT);
                $stmt = $pdo->prepare("INSERT INTO users (email, password, name, role) VALUES (?, ?, ?, ?)");
                try {
                    $stmt->execute([$data['email'], $hashed, $data['name'], 'player']);
                    echo json_encode(['success' => true, 'id' => $pdo->lastInsertId()]);
                } catch (PDOException $e) {
                    http_response_code(400);
                    echo json_encode(['error' => $e->getMessage()]);
                }
            } else {
                http_response_code(400);
                echo json_encode(['error' => 'Invalid auth action']);
            }
        }
        break;

    case 'players':
    case 'matches':
    case 'teams':
    case 'announcements':
        handleCrud($resource, $method, $id);
        break;

    default:
        http_response_code(404);
        echo json_encode(['error' => 'Resource not found']);
        break;
}
?>
