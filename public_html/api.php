<?php
// api.php
require_once 'config.php';

// Get request method and path
$method = $_SERVER['REQUEST_METHOD'];
$path = explode('/', trim($_SERVER['PATH_INFO'] ?? '/', '/'));
$resource = $path[0] ?? '';
$id = $path[1] ?? null;

// Router
switch ($resource) {
    case 'auth':
        if ($method === 'POST') {
            // Login or register based on action parameter
            $action = $_GET['action'] ?? '';
            if ($action === 'login') {
                login();
            } elseif ($action === 'register') {
                register();
            } else {
                http_response_code(400);
                echo json_encode(['error' => 'Invalid auth action']);
            }
        }
        break;

    case 'players':
        handleCrud('players', $method, $id);
        break;

    case 'matches':
        handleCrud('matches', $method, $id);
        break;

    case 'teams':
        handleCrud('teams', $method, $id);
        break;

    case 'announcements':
        handleCrud('announcements', $method, $id);
        break;

    default:
        http_response_code(404);
        echo json_encode(['error' => 'Resource not found']);
        break;
}

// ================= CRUD HANDLER =================
function handleCrud($table, $method, $id) {
    global $pdo;

    switch ($method) {
        case 'GET':
            if ($id) {
                // Fetch single record
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
                // Fetch all (with optional filtering)
                $stmt = $pdo->query("SELECT * FROM $table ORDER BY id DESC");
                $results = $stmt->fetchAll(PDO::FETCH_ASSOC);
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
            // Insert logic (we'll build dynamically)
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
            // Update record (expect id in URL and JSON body)
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
                echo json_encode(['error' => 'ID required for delete']);
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

// ================= AUTH FUNCTIONS =================
function login() {
    global $pdo;
    $data = json_decode(file_get_contents('php://input'), true);
    if (!$data || !isset($data['email']) || !isset($data['password'])) {
        http_response_code(400);
        echo json_encode(['error' => 'Email and password required']);
        return;
    }
    $stmt = $pdo->prepare("SELECT * FROM users WHERE email = ?");
    $stmt->execute([$data['email']]);
    $user = $stmt->fetch(PDO::FETCH_ASSOC);

    if ($user && password_verify($data['password'], $user['password'])) {
        $_SESSION['user_id'] = $user['id'];
        $_SESSION['role'] = $user['role'];
        echo json_encode([
            'success' => true,
            'user' => ['id' => $user['id'], 'name' => $user['name'], 'email' => $user['email'], 'role' => $user['role']]
        ]);
    } else {
        http_response_code(401);
        echo json_encode(['error' => 'Invalid credentials']);
    }
}

function register() {
    global $pdo;
    $data = json_decode(file_get_contents('php://input'), true);
    if (!$data || !isset($data['email']) || !isset($data['password']) || !isset($data['name'])) {
        http_response_code(400);
        echo json_encode(['error' => 'Email, password, and name required']);
        return;
    }
    // Check if email exists
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
        echo json_encode(['success' => true, 'id' => $pdo->lastInsertId()]);
    } catch (PDOException $e) {
        http_response_code(400);
        echo json_encode(['error' => $e->getMessage()]);
    }
}
?>
