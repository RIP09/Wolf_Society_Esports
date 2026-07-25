<?php
/**
 * ============================================================
 * WOLF SOCIETY ESPORTS – COMPLETE REST API
 * Version: 2.0.0
 * Database: MySQL (InfinityFree)
 * ============================================================
 */

// ─── CORS Headers ───
header('Access-Control-Allow-Origin: https://wolfsocietygg.vercel.app');
header('Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type, Authorization, X-Requested-With');
header('Content-Type: application/json');

// Handle preflight requests
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit;
}

// ─── Database Configuration ───
// CHANGE THESE VALUES to your InfinityFree database credentials
$DB_HOST = 'localhost';
$DB_NAME = 'YOUR_DATABASE_NAME';      // e.g., ifreedb_12345678_wolf
$DB_USER = 'YOUR_DATABASE_USER';      // e.g., ifreedb_12345678
$DB_PASS = 'YOUR_DATABASE_PASSWORD';

try {
    $pdo = new PDO("mysql:host=$DB_HOST;dbname=$DB_NAME;charset=utf8mb4", $DB_USER, $DB_PASS);
    $pdo->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);
    $pdo->setAttribute(PDO::ATTR_DEFAULT_FETCH_MODE, PDO::FETCH_ASSOC);
} catch (PDOException $e) {
    http_response_code(500);
    echo json_encode(['error' => 'Database connection failed: ' . $e->getMessage()]);
    exit;
}

// Start session for authentication
if (session_status() === PHP_SESSION_NONE) {
    session_start();
}

// ─── Helper: Generate UUID (for local IDs) ───
function generateUuid() {
    return sprintf('%04x%04x-%04x-%04x-%04x-%04x%04x%04x',
        mt_rand(0, 0xffff), mt_rand(0, 0xffff),
        mt_rand(0, 0xffff),
        mt_rand(0, 0x0fff) | 0x4000,
        mt_rand(0, 0x3fff) | 0x8000,
        mt_rand(0, 0xffff), mt_rand(0, 0xffff), mt_rand(0, 0xffff)
    );
}

// ─── CRUD Handler ───
function handleCrud($table, $method, $id = null) {
    global $pdo;

    // Validate table name (prevent SQL injection)
    $allowedTables = ['players', 'matches', 'teams', 'announcements'];
    if (!in_array($table, $allowedTables)) {
        http_response_code(400);
        echo json_encode(['error' => 'Invalid table name']);
        return;
    }

    switch ($method) {
        case 'GET':
            if ($id) {
                // Get single record
                $stmt = $pdo->prepare("SELECT * FROM `$table` WHERE id = ?");
                $stmt->execute([$id]);
                $result = $stmt->fetch();
                if ($result) {
                    echo json_encode($result);
                } else {
                    http_response_code(404);
                    echo json_encode(['error' => 'Record not found']);
                }
            } else {
                // Get all records
                $stmt = $pdo->query("SELECT * FROM `$table` ORDER BY id DESC");
                $results = $stmt->fetchAll();
                echo json_encode($results);
            }
            break;

        case 'POST':
            // Create new record
            $data = json_decode(file_get_contents('php://input'), true);
            if (!$data) {
                http_response_code(400);
                echo json_encode(['error' => 'Invalid JSON input']);
                return;
            }

            // Remove id if present (auto-increment)
            unset($data['id']);

            // Build insert query
            $columns = array_keys($data);
            $placeholders = implode(',', array_fill(0, count($columns), '?'));
            $sql = "INSERT INTO `$table` (" . implode(',', $columns) . ") VALUES ($placeholders)";
            $stmt = $pdo->prepare($sql);

            try {
                $stmt->execute(array_values($data));
                echo json_encode([
                    'success' => true,
                    'id' => $pdo->lastInsertId()
                ]);
            } catch (PDOException $e) {
                http_response_code(400);
                echo json_encode(['error' => $e->getMessage()]);
            }
            break;

        case 'PUT':
            // Update record
            if (!$id) {
                http_response_code(400);
                echo json_encode(['error' => 'ID required for update']);
                return;
            }

            $data = json_decode(file_get_contents('php://input'), true);
            if (!$data) {
                http_response_code(400);
                echo json_encode(['error' => 'Invalid JSON input']);
                return;
            }

            // Build update query
            $sets = [];
            $values = [];
            foreach ($data as $key => $val) {
                $sets[] = "$key = ?";
                $values[] = $val;
            }
            $values[] = $id;
            $sql = "UPDATE `$table` SET " . implode(',', $sets) . " WHERE id = ?";
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
                echo json_encode(['error' => 'ID required for delete']);
                return;
            }

            $stmt = $pdo->prepare("DELETE FROM `$table` WHERE id = ?");
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

// ─── Authentication Functions ───
function handleAuth($action) {
    global $pdo;

    $data = json_decode(file_get_contents('php://input'), true);

    if ($action === 'login') {
        if (!isset($data['email']) || !isset($data['password'])) {
            http_response_code(400);
            echo json_encode(['error' => 'Email and password required']);
            return;
        }

        $stmt = $pdo->prepare("SELECT * FROM users WHERE email = ?");
        $stmt->execute([$data['email']]);
        $user = $stmt->fetch();

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
            echo json_encode(['error' => 'Invalid email or password']);
        }
    } elseif ($action === 'register') {
        if (!isset($data['email']) || !isset($data['password']) || !isset($data['name'])) {
            http_response_code(400);
            echo json_encode(['error' => 'Email, password, and name required']);
            return;
        }

        // Check if email already exists
        $stmt = $pdo->prepare("SELECT id FROM users WHERE email = ?");
        $stmt->execute([$data['email']]);
        if ($stmt->fetch()) {
            http_response_code(409);
            echo json_encode(['error' => 'Email already registered']);
            return;
        }

        $hashed = password_hash($data['password'], PASSWORD_DEFAULT);
        $stmt = $pdo->prepare("INSERT INTO users (email, password, name, role) VALUES (?, ?, ?, ?)");
        try {
            $stmt->execute([$data['email'], $hashed, $data['name'], 'player']);
            echo json_encode([
                'success' => true,
                'id' => $pdo->lastInsertId()
            ]);
        } catch (PDOException $e) {
            http_response_code(400);
            echo json_encode(['error' => $e->getMessage()]);
        }
    } else {
        http_response_code(400);
        echo json_encode(['error' => 'Invalid auth action']);
    }
}

// ─── Router ───
$path = explode('/', trim($_SERVER['PATH_INFO'] ?? '/', '/'));
$resource = $path[0] ?? '';
$id = $path[1] ?? null;
$method = $_SERVER['REQUEST_METHOD'];

switch ($resource) {
    case 'auth':
        $action = $_GET['action'] ?? '';
        handleAuth($action);
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
