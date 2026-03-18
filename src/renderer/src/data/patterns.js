// Pattern Library — all algorithmic patterns and data structures referenced by problems

export const patterns = [
  // ─── Techniques ────────────────────────────────────────────────────────────

  {
    id: 'sliding-window',
    name: 'Sliding Window',
    emoji: '🪟',
    category: 'technique',
    description: 'Maintain a window of elements that slides over a sequence. Expand the window by moving the right pointer, shrink it by moving the left pointer. Avoids redundant recomputation by incrementally updating window state.',
    whenToUse: [
      'Find a subarray/substring satisfying a condition (max sum, unique chars, etc.)',
      'The problem asks for a contiguous subarray of fixed or variable length',
      'Brute-force would be O(n²) by checking all subarrays',
      'Constraint involves "at most k", "exactly k", or "minimum/maximum window"',
    ],
    template: `def sliding_window(s, k):
    left = 0
    window = {}   # or a counter / running sum
    result = 0

    for right in range(len(s)):
        # --- expand: add s[right] to window ---
        window[s[right]] = window.get(s[right], 0) + 1

        # --- shrink: while window is invalid ---
        while len(window) > k:   # replace condition as needed
            window[s[left]] -= 1
            if window[s[left]] == 0:
                del window[s[left]]
            left += 1

        # --- update answer ---
        result = max(result, right - left + 1)

    return result`,
    relatedPatterns: ['two-pointers', 'hash-map', 'prefix-sum'],
    complexity: { time: 'O(n)', space: 'O(k)' },
  },

  {
    id: 'two-pointers',
    name: 'Two Pointers',
    emoji: '👆',
    category: 'technique',
    description: 'Use two indices that move through the data structure—often toward each other from both ends, or at different speeds (fast/slow). Eliminates the need for nested loops in many sorted-array and linked-list problems.',
    whenToUse: [
      'Input is sorted and you need pairs/triplets summing to a target',
      'Detecting a cycle in a linked list (fast/slow pointers)',
      'Removing duplicates or partitioning in-place',
      'Palindrome checking or reversing',
      'Merging two sorted arrays',
    ],
    template: `def two_pointers(arr, target):
    left, right = 0, len(arr) - 1

    while left < right:
        current = arr[left] + arr[right]
        if current == target:
            return [left, right]
        elif current < target:
            left += 1
        else:
            right -= 1

    return []`,
    relatedPatterns: ['sliding-window', 'binary-search'],
    complexity: { time: 'O(n)', space: 'O(1)' },
  },

  {
    id: 'binary-search',
    name: 'Binary Search',
    emoji: '🔍',
    category: 'technique',
    description: 'Halve the search space each iteration by comparing the midpoint against the target. Works on sorted arrays and, crucially, on any monotonic function — "binary search on the answer" — where you can check whether a value is feasible in O(n).',
    whenToUse: [
      'Array is sorted (or rotated sorted)',
      '"Find minimum/maximum value such that condition holds" — binary search on answer',
      'O(log n) time required',
      'Search in a 2D matrix treated as a 1D sorted array',
    ],
    template: `def binary_search(nums, target):
    left, right = 0, len(nums) - 1

    while left <= right:
        mid = left + (right - left) // 2   # avoids overflow
        if nums[mid] == target:
            return mid
        elif nums[mid] < target:
            left = mid + 1
        else:
            right = mid - 1

    return -1   # not found

# Binary search on answer — find minimum feasible value
def binary_search_on_answer(lo, hi):
    while lo < hi:
        mid = (lo + hi) // 2
        if is_feasible(mid):   # define your feasibility check
            hi = mid           # try smaller
        else:
            lo = mid + 1
    return lo`,
    relatedPatterns: ['two-pointers', 'divide-and-conquer'],
    complexity: { time: 'O(log n)', space: 'O(1)' },
  },

  {
    id: 'dynamic-programming',
    name: 'Dynamic Programming',
    emoji: '🧩',
    category: 'technique',
    description: 'Break a problem into overlapping subproblems and store results to avoid recomputation. Two styles: top-down (memoization) adds a cache to recursion; bottom-up (tabulation) fills a table iteratively from base cases.',
    whenToUse: [
      'Problem asks for count, min, max, or boolean feasibility',
      'Optimal substructure: optimal solution contains optimal sub-solutions',
      'Overlapping subproblems: same sub-inputs recur',
      'Classic shapes: 1-D sequences (house robber), 2-D grids (unique paths), interval DP, knapsack',
    ],
    template: `# Bottom-up 1-D DP (e.g. climbing stairs)
def dp_1d(n):
    if n <= 1:
        return n
    dp = [0] * (n + 1)
    dp[0], dp[1] = 1, 1
    for i in range(2, n + 1):
        dp[i] = dp[i-1] + dp[i-2]
    return dp[n]

# Top-down with memoization
from functools import lru_cache

def dp_memo(n):
    @lru_cache(maxsize=None)
    def solve(i):
        if i <= 1:
            return i
        return solve(i-1) + solve(i-2)
    return solve(n)`,
    relatedPatterns: ['greedy', 'divide-and-conquer', 'backtracking'],
    complexity: { time: 'O(n) – O(n²) typical', space: 'O(n)' },
  },

  {
    id: 'greedy',
    name: 'Greedy',
    emoji: '💰',
    category: 'technique',
    description: 'Make the locally optimal choice at each step, trusting that a globally optimal solution follows. Simpler and faster than DP when a greedy choice property holds — prove it by exchange argument or induction.',
    whenToUse: [
      'Interval scheduling / merging problems (sort by end time)',
      'Jump Game — can you always take the max reach?',
      'Activity selection, task scheduling with deadlines',
      'When a single pass with a local decision suffices',
    ],
    template: `# Interval scheduling — greedy by earliest end time
def greedy_intervals(intervals):
    intervals.sort(key=lambda x: x[1])  # sort by end
    count = 0
    end = float('-inf')

    for start, finish in intervals:
        if start >= end:       # non-overlapping
            count += 1
            end = finish

    return count`,
    relatedPatterns: ['dynamic-programming', 'sorting'],
    complexity: { time: 'O(n log n)', space: 'O(1)' },
  },

  {
    id: 'backtracking',
    name: 'Backtracking',
    emoji: '🔄',
    category: 'technique',
    description: 'Explore all possibilities via DFS, undoing ("backtracking") choices that lead to dead ends. The key insight is pruning: cut branches early when they cannot yield a valid solution.',
    whenToUse: [
      'Generate all permutations, subsets, combinations',
      'Constraint satisfaction: N-Queens, Sudoku',
      'Word search on a grid',
      'Need all solutions, not just one',
    ],
    template: `def backtrack(nums):
    results = []

    def dfs(path, remaining):
        if not remaining:           # base case: valid solution
            results.append(path[:])
            return

        for i, num in enumerate(remaining):
            path.append(num)        # choose
            dfs(path, remaining[:i] + remaining[i+1:])  # explore
            path.pop()              # undo

    dfs([], nums)
    return results`,
    relatedPatterns: ['depth-first-search', 'dynamic-programming'],
    complexity: { time: 'O(n!) worst case', space: 'O(n) recursion depth' },
  },

  {
    id: 'depth-first-search',
    name: 'Depth-First Search',
    emoji: '🌊',
    category: 'technique',
    description: 'Traverse a graph or tree by going as deep as possible before backtracking. Implemented recursively (call stack) or iteratively (explicit stack). Essential for connected components, cycle detection, topological sort, and tree traversals.',
    whenToUse: [
      'Tree traversals (pre/in/post-order)',
      'Counting or exploring connected components in a graph/grid',
      'Cycle detection in directed graphs',
      'Finding paths, articulation points, strongly connected components',
    ],
    template: `# Graph DFS (iterative)
def dfs(graph, start):
    visited = set()
    stack = [start]

    while stack:
        node = stack.pop()
        if node in visited:
            continue
        visited.add(node)
        # process node here
        for neighbor in graph[node]:
            if neighbor not in visited:
                stack.append(neighbor)

    return visited

# Tree DFS (recursive)
def dfs_tree(root):
    if not root:
        return
    # preorder: process root first
    dfs_tree(root.left)
    dfs_tree(root.right)`,
    relatedPatterns: ['breadth-first-search', 'backtracking', 'topological-sort'],
    complexity: { time: 'O(V + E)', space: 'O(V)' },
  },

  {
    id: 'breadth-first-search',
    name: 'Breadth-First Search',
    emoji: '🌐',
    category: 'technique',
    description: 'Explore a graph level by level using a queue. Guarantees the shortest path in unweighted graphs. Ideal for level-order tree traversal and finding minimum steps.',
    whenToUse: [
      'Shortest path in an unweighted graph or grid',
      'Level-order binary tree traversal',
      'Finding the minimum number of steps/moves',
      'Multi-source BFS (start from multiple nodes simultaneously)',
    ],
    template: `from collections import deque

def bfs(graph, start):
    visited = {start}
    queue = deque([start])
    distance = {start: 0}

    while queue:
        node = queue.popleft()
        for neighbor in graph[node]:
            if neighbor not in visited:
                visited.add(neighbor)
                distance[neighbor] = distance[node] + 1
                queue.append(neighbor)

    return distance`,
    relatedPatterns: ['depth-first-search', 'graph'],
    complexity: { time: 'O(V + E)', space: 'O(V)' },
  },

  {
    id: 'divide-and-conquer',
    name: 'Divide & Conquer',
    emoji: '✂️',
    category: 'technique',
    description: 'Split the problem into independent subproblems, solve each recursively, then merge results. Unlike DP, subproblems do not overlap. Classic examples: merge sort, quicksort, binary search.',
    whenToUse: [
      'Problem naturally splits into independent halves (merge sort, binary search)',
      'Merge K sorted lists using a heap or recursive splitting',
      'The merge step is the creative part of the solution',
    ],
    template: `def merge_sort(arr):
    if len(arr) <= 1:
        return arr

    mid = len(arr) // 2
    left = merge_sort(arr[:mid])
    right = merge_sort(arr[mid:])
    return merge(left, right)

def merge(left, right):
    result = []
    i = j = 0
    while i < len(left) and j < len(right):
        if left[i] <= right[j]:
            result.append(left[i]); i += 1
        else:
            result.append(right[j]); j += 1
    return result + left[i:] + right[j:]`,
    relatedPatterns: ['binary-search', 'dynamic-programming'],
    complexity: { time: 'O(n log n)', space: 'O(n)' },
  },

  {
    id: 'topological-sort',
    name: 'Topological Sort',
    emoji: '📊',
    category: 'technique',
    description: 'Order nodes in a directed acyclic graph (DAG) so every edge u→v has u before v. Two approaches: Kahn\'s algorithm (BFS with in-degree counts) or DFS with post-order reversal. Used for task scheduling and dependency resolution.',
    whenToUse: [
      'Detecting cycles in a directed graph',
      'Course prerequisite / task dependency ordering',
      'Any problem with directed dependencies that need ordering',
    ],
    template: `from collections import deque

def topo_sort(n, prerequisites):
    graph = [[] for _ in range(n)]
    in_degree = [0] * n

    for course, pre in prerequisites:
        graph[pre].append(course)
        in_degree[course] += 1

    queue = deque(i for i in range(n) if in_degree[i] == 0)
    order = []

    while queue:
        node = queue.popleft()
        order.append(node)
        for neighbor in graph[node]:
            in_degree[neighbor] -= 1
            if in_degree[neighbor] == 0:
                queue.append(neighbor)

    return order if len(order) == n else []  # [] = cycle detected`,
    relatedPatterns: ['depth-first-search', 'breadth-first-search', 'graph'],
    complexity: { time: 'O(V + E)', space: 'O(V + E)' },
  },

  {
    id: 'union-find',
    name: 'Union-Find',
    emoji: '🔗',
    category: 'technique',
    description: 'Efficiently track which elements belong to the same connected component with two operations: find (with path compression) and union (by rank). Near O(1) per operation amortized.',
    whenToUse: [
      'Count connected components in an undirected graph',
      'Detect cycles in an undirected graph',
      'Check if two nodes are in the same component',
      "Kruskal's minimum spanning tree",
    ],
    template: `class UnionFind:
    def __init__(self, n):
        self.parent = list(range(n))
        self.rank = [0] * n
        self.components = n

    def find(self, x):
        if self.parent[x] != x:
            self.parent[x] = self.find(self.parent[x])  # path compression
        return self.parent[x]

    def union(self, x, y):
        px, py = self.find(x), self.find(y)
        if px == py:
            return False   # already connected
        if self.rank[px] < self.rank[py]:
            px, py = py, px
        self.parent[py] = px
        if self.rank[px] == self.rank[py]:
            self.rank[px] += 1
        self.components -= 1
        return True`,
    relatedPatterns: ['depth-first-search', 'graph'],
    complexity: { time: 'O(α(n)) ≈ O(1) amortized', space: 'O(n)' },
  },

  {
    id: 'prefix-sum',
    name: 'Prefix Sum',
    emoji: '➕',
    category: 'technique',
    description: 'Precompute cumulative sums so any subarray sum [i, j] is answered in O(1) as prefix[j+1] - prefix[i]. The same idea extends to products, XOR, and 2D grids.',
    whenToUse: [
      'Range sum / product queries',
      'Subarray sum equals k (combine with hash map)',
      'Product of array except self',
      '2D range queries',
    ],
    template: `def prefix_sum(nums):
    prefix = [0] * (len(nums) + 1)
    for i, n in enumerate(nums):
        prefix[i+1] = prefix[i] + n
    # subarray sum [l, r] = prefix[r+1] - prefix[l]
    return prefix

# Subarray sum equals k
def subarray_sum(nums, k):
    count = 0
    running = 0
    seen = {0: 1}   # prefix_sum -> count
    for n in nums:
        running += n
        count += seen.get(running - k, 0)
        seen[running] = seen.get(running, 0) + 1
    return count`,
    relatedPatterns: ['sliding-window', 'hash-map', 'array'],
    complexity: { time: 'O(n) build, O(1) query', space: 'O(n)' },
  },

  {
    id: 'monotonic-stack',
    name: 'Monotonic Stack',
    emoji: '📚',
    category: 'technique',
    description: 'Maintain a stack that is always sorted (increasing or decreasing). Elements are popped when a new element violates the order, which is exactly when "next greater/smaller" events occur. Also used as a monotonic deque for sliding window maximum.',
    whenToUse: [
      'Next greater/smaller element to the right or left',
      'Trapping rain water',
      'Largest rectangle in histogram',
      'Sliding window maximum (monotonic deque)',
    ],
    template: `# Next greater element (monotone decreasing stack)
def next_greater(nums):
    result = [-1] * len(nums)
    stack = []   # stores indices

    for i, n in enumerate(nums):
        while stack and nums[stack[-1]] < n:
            idx = stack.pop()
            result[idx] = n   # n is the next greater element
        stack.append(i)

    return result

# Sliding window maximum (monotone deque)
from collections import deque

def sliding_max(nums, k):
    dq = deque()   # indices, decreasing values
    result = []
    for i, n in enumerate(nums):
        while dq and nums[dq[-1]] < n:
            dq.pop()
        dq.append(i)
        if dq[0] == i - k:   # remove out-of-window index
            dq.popleft()
        if i >= k - 1:
            result.append(nums[dq[0]])
    return result`,
    relatedPatterns: ['stack', 'sliding-window'],
    complexity: { time: 'O(n)', space: 'O(n)' },
  },

  {
    id: 'bit-manipulation',
    name: 'Bit Manipulation',
    emoji: '🔢',
    category: 'technique',
    description: 'Operate directly on integer bits using AND (&), OR (|), XOR (^), NOT (~), and shifts (<<, >>). XOR is especially useful: x ^ x = 0 and x ^ 0 = x. Brian Kernighan\'s trick (n & (n-1)) removes the lowest set bit.',
    whenToUse: [
      'Count set bits (Hamming weight)',
      'Find the single non-duplicate element (XOR all)',
      'Check/set/clear a specific bit',
      'Missing number, reverse bits, add without + operator',
    ],
    template: `# Common bit tricks
x & (x - 1)     # clear lowest set bit
x & (-x)        # isolate lowest set bit
x ^ x           # = 0  (cancel duplicates)
x ^ 0           # = x  (identity)

def count_bits(n):
    count = 0
    while n:
        n &= n - 1   # Brian Kernighan
        count += 1
    return count

def single_number(nums):
    result = 0
    for n in nums:
        result ^= n   # pairs cancel; solo survives
    return result`,
    relatedPatterns: ['dynamic-programming'],
    complexity: { time: 'O(1) or O(n)', space: 'O(1)' },
  },

  // ─── Data Structures ───────────────────────────────────────────────────────

  {
    id: 'array',
    name: 'Array',
    emoji: '📦',
    category: 'data-structure',
    description: 'Contiguous block of elements with O(1) random access by index. The most fundamental data structure — most problems use arrays. Key operations: index access, iteration, in-place swapping, sorting.',
    whenToUse: [
      'Random access by index is needed',
      'In-place modifications (rotate, reverse, partition)',
      'Sorting-based approaches',
      'Used as the underlying storage for most other structures',
    ],
    template: `# Common array patterns
nums.sort()                          # O(n log n)
nums.sort(key=lambda x: -x)         # sort descending
left, right = 0, len(nums) - 1     # two-pointer setup
prefix = list(itertools.accumulate(nums))  # prefix sums

# In-place partition
def move_zeros(nums):
    insert = 0
    for n in nums:
        if n != 0:
            nums[insert] = n
            insert += 1
    while insert < len(nums):
        nums[insert] = 0
        insert += 1`,
    relatedPatterns: ['two-pointers', 'sliding-window', 'binary-search'],
    complexity: { time: 'O(1) access, O(n) search', space: 'O(1) in-place' },
  },

  {
    id: 'string',
    name: 'String',
    emoji: '📝',
    category: 'data-structure',
    description: 'Sequence of characters. In Python, strings are immutable — build results with lists and join. Key techniques: two-pointer palindrome expansion, sliding window for substrings, character frequency counts.',
    whenToUse: [
      'Substring problems (sliding window)',
      'Palindrome detection (expand around center, or two pointers)',
      'Anagram/frequency matching (hash map of char counts)',
      'Parsing and pattern matching',
    ],
    template: `# Frequency count
from collections import Counter
freq = Counter(s)

# Expand around center (palindromes)
def expand(s, l, r):
    while l >= 0 and r < len(s) and s[l] == s[r]:
        l -= 1; r += 1
    return s[l+1:r]   # longest palindrome centered here

# Build string efficiently
result = []
result.append(char)
return ''.join(result)`,
    relatedPatterns: ['sliding-window', 'two-pointers', 'dynamic-programming', 'hash-map'],
    complexity: { time: 'O(n)', space: 'O(n)' },
  },

  {
    id: 'hash-map',
    name: 'Hash Map / Set',
    emoji: '#️⃣',
    category: 'data-structure',
    description: 'O(1) average insert, lookup, and delete. Hash maps store key→value pairs; hash sets store unique keys. The go-to structure for frequency counting, two-sum style lookups, and caching visited states.',
    whenToUse: [
      'Two Sum — store complement, check in O(1)',
      'Frequency counts (char counts, element counts)',
      'Detecting duplicates or checking membership',
      'Caching / memoization lookup tables',
    ],
    template: `from collections import defaultdict, Counter

# Two Sum pattern
def two_sum(nums, target):
    seen = {}  # value -> index
    for i, n in enumerate(nums):
        if target - n in seen:
            return [seen[target - n], i]
        seen[n] = i
    return []

# Frequency count
freq = Counter(nums)            # Counter({'a': 3, 'b': 2, ...})
freq = defaultdict(int)         # auto-initializes to 0

# Group by key
groups = defaultdict(list)
for item in items:
    groups[key(item)].append(item)`,
    relatedPatterns: ['array', 'sliding-window', 'prefix-sum'],
    complexity: { time: 'O(1) average', space: 'O(n)' },
  },

  {
    id: 'linked-list',
    name: 'Linked List',
    emoji: '⛓️',
    category: 'data-structure',
    description: 'Nodes connected by pointers. O(1) insertion/deletion at known position, O(n) access. Classic techniques: dummy head, fast/slow pointers, reversing in-place.',
    whenToUse: [
      'Reverse a linked list (iterative or recursive)',
      'Detect cycles (Floyd\'s fast/slow pointer)',
      'Find the middle node, or the nth from end',
      'Merge sorted lists',
    ],
    template: `# Reverse linked list (iterative)
def reverse(head):
    prev = None
    curr = head
    while curr:
        nxt = curr.next
        curr.next = prev
        prev = curr
        curr = nxt
    return prev

# Fast/slow pointers — find middle
def find_middle(head):
    slow = fast = head
    while fast and fast.next:
        slow = slow.next
        fast = fast.next.next
    return slow   # slow is at middle`,
    relatedPatterns: ['two-pointers', 'divide-and-conquer'],
    complexity: { time: 'O(n)', space: 'O(1) iterative' },
  },

  {
    id: 'tree',
    name: 'Binary Tree',
    emoji: '🌲',
    category: 'data-structure',
    description: 'Each node has at most two children. Traverse with DFS (pre/in/post-order) or BFS (level order). Many problems reduce to a recursive definition: solve left subtree, solve right subtree, combine.',
    whenToUse: [
      'Tree traversal (preorder/inorder/postorder/level-order)',
      'Compute height, diameter, or path sums',
      'Find LCA (lowest common ancestor)',
      'Construct tree from traversal arrays',
    ],
    template: `class TreeNode:
    def __init__(self, val=0, left=None, right=None):
        self.val = val
        self.left = left
        self.right = right

# Generic DFS — returns value at each node
def dfs(node):
    if not node:
        return base_case   # e.g., 0 or float('-inf')
    left  = dfs(node.left)
    right = dfs(node.right)
    return combine(node.val, left, right)

# Level-order BFS
from collections import deque
def level_order(root):
    if not root: return []
    q, result = deque([root]), []
    while q:
        level = []
        for _ in range(len(q)):
            node = q.popleft()
            level.append(node.val)
            if node.left:  q.append(node.left)
            if node.right: q.append(node.right)
        result.append(level)
    return result`,
    relatedPatterns: ['depth-first-search', 'breadth-first-search', 'dynamic-programming'],
    complexity: { time: 'O(n)', space: 'O(h) where h = height' },
  },

  {
    id: 'binary-search-tree',
    name: 'Binary Search Tree',
    emoji: '🎯',
    category: 'data-structure',
    description: 'A binary tree where left child < node < right child. Inorder traversal yields a sorted sequence. BST properties let you prune half the tree at each step, giving O(h) search. Balanced BSTs guarantee O(log n).',
    whenToUse: [
      'Kth smallest/largest element (inorder traversal)',
      'Validate BST property',
      'Find LCA in a BST (exploit ordering)',
      'Inorder traversal produces sorted output',
    ],
    template: `# Inorder traversal — yields sorted sequence
def inorder(root, result=[]):
    if not root:
        return
    inorder(root.left, result)
    result.append(root.val)
    inorder(root.right, result)
    return result

# BST search
def search(root, target):
    if not root or root.val == target:
        return root
    if target < root.val:
        return search(root.left, target)
    return search(root.right, target)

# LCA in BST
def lca_bst(root, p, q):
    while root:
        if p.val < root.val and q.val < root.val:
            root = root.left
        elif p.val > root.val and q.val > root.val:
            root = root.right
        else:
            return root`,
    relatedPatterns: ['tree', 'depth-first-search', 'binary-search'],
    complexity: { time: 'O(h): O(log n) balanced, O(n) skewed', space: 'O(h)' },
  },

  {
    id: 'graph',
    name: 'Graph',
    emoji: '🕸️',
    category: 'data-structure',
    description: 'Nodes (vertices) connected by edges. Can be directed/undirected, weighted/unweighted, cyclic/acyclic. Represented as adjacency list (sparse) or matrix (dense). Most graph problems reduce to DFS, BFS, or Union-Find.',
    whenToUse: [
      'Connectivity and reachability queries',
      'Shortest path (BFS for unweighted, Dijkstra for weighted)',
      'Detect cycles in directed or undirected graphs',
      'Grid problems (treat each cell as a node)',
    ],
    template: `from collections import defaultdict, deque

# Build adjacency list
def build_graph(edges):
    graph = defaultdict(list)
    for u, v in edges:
        graph[u].append(v)
        graph[v].append(u)   # remove for directed
    return graph

# DFS on a grid (number of islands)
def num_islands(grid):
    rows, cols = len(grid), len(grid[0])
    count = 0

    def dfs(r, c):
        if r < 0 or r >= rows or c < 0 or c >= cols or grid[r][c] == '0':
            return
        grid[r][c] = '0'   # mark visited
        for dr, dc in [(0,1),(0,-1),(1,0),(-1,0)]:
            dfs(r + dr, c + dc)

    for r in range(rows):
        for c in range(cols):
            if grid[r][c] == '1':
                dfs(r, c); count += 1
    return count`,
    relatedPatterns: ['depth-first-search', 'breadth-first-search', 'union-find', 'topological-sort'],
    complexity: { time: 'O(V + E)', space: 'O(V + E)' },
  },

  {
    id: 'stack',
    name: 'Stack',
    emoji: '📚',
    category: 'data-structure',
    description: 'Last-in, first-out (LIFO). Use a Python list as a stack: append to push, pop to pop, [-1] to peek. Ideal for matching/balancing problems and implementing DFS iteratively.',
    whenToUse: [
      'Matching brackets / valid parentheses',
      'Evaluate expressions (postfix notation)',
      'Undo/redo history, browser back-button',
      'Iterative DFS implementation',
    ],
    template: `# Valid parentheses
def is_valid(s):
    stack = []
    pairs = {')': '(', '}': '{', ']': '['}
    for ch in s:
        if ch in '({[':
            stack.append(ch)
        elif not stack or stack[-1] != pairs[ch]:
            return False
        else:
            stack.pop()
    return len(stack) == 0

# Iterative DFS using explicit stack
stack = [start]
visited = set()
while stack:
    node = stack.pop()
    if node not in visited:
        visited.add(node)
        stack.extend(graph[node])`,
    relatedPatterns: ['monotonic-stack', 'depth-first-search'],
    complexity: { time: 'O(1) push/pop', space: 'O(n)' },
  },

  {
    id: 'heap',
    name: 'Heap / Priority Queue',
    emoji: '⛏️',
    category: 'data-structure',
    description: 'Complete binary tree satisfying the heap property: parent ≤ children (min-heap). O(log n) insert and extract-min, O(1) peek. Python\'s heapq is a min-heap; negate values for max-heap.',
    whenToUse: [
      'Kth largest/smallest element',
      'Merge K sorted lists/arrays',
      'Top-K frequent elements',
      'Meeting rooms II — track overlapping intervals',
      'Any "always access the smallest/largest" pattern',
    ],
    template: `import heapq

# Min-heap (default)
heap = []
heapq.heappush(heap, val)
smallest = heapq.heappop(heap)
peek = heap[0]

# Max-heap — negate values
heapq.heappush(heap, -val)
largest = -heapq.heappop(heap)

# Heapify in O(n)
heapq.heapify(arr)

# K largest elements
def k_largest(nums, k):
    return heapq.nlargest(k, nums)

# Merge K sorted lists
def merge_k(lists):
    heap = []
    for i, lst in enumerate(lists):
        if lst:
            heapq.heappush(heap, (lst[0], i, 0))
    result = []
    while heap:
        val, i, j = heapq.heappop(heap)
        result.append(val)
        if j + 1 < len(lists[i]):
            heapq.heappush(heap, (lists[i][j+1], i, j+1))
    return result`,
    relatedPatterns: ['divide-and-conquer', 'greedy', 'intervals'],
    complexity: { time: 'O(log n) push/pop, O(n) heapify', space: 'O(n)' },
  },

  {
    id: 'matrix',
    name: 'Matrix',
    emoji: '🔲',
    category: 'data-structure',
    description: 'A 2D grid of values. Access by [row][col]. Common techniques: in-place rotation (transpose + reflect), spiral traversal, multi-source BFS/DFS, and treating cells as graph nodes.',
    whenToUse: [
      'Rotate image 90°, spiral order traversal',
      'Set matrix zeroes (flag rows/cols)',
      'Binary search on a sorted 2D matrix',
      'DFS/BFS flood-fill on a grid',
    ],
    template: `# Rotate matrix 90° clockwise (in-place)
def rotate(matrix):
    n = len(matrix)
    # Step 1: transpose
    for i in range(n):
        for j in range(i+1, n):
            matrix[i][j], matrix[j][i] = matrix[j][i], matrix[i][j]
    # Step 2: reverse each row
    for row in matrix:
        row.reverse()

# 4-directional neighbors
DIRS = [(0,1),(0,-1),(1,0),(-1,0)]
for dr, dc in DIRS:
    nr, nc = r + dr, c + dc
    if 0 <= nr < rows and 0 <= nc < cols:
        # process (nr, nc)
        pass`,
    relatedPatterns: ['depth-first-search', 'breadth-first-search', 'binary-search', 'array'],
    complexity: { time: 'O(m·n)', space: 'O(1) in-place' },
  },

  {
    id: 'intervals',
    name: 'Intervals',
    emoji: '📅',
    category: 'data-structure',
    description: 'Problems involving ranges [start, end]. The key insight is to sort by start time (or end time for greedy scheduling). Merge overlapping intervals by comparing next start against running max end.',
    whenToUse: [
      'Merge overlapping intervals',
      'Insert a new interval into a sorted list',
      'Count minimum meeting rooms (sort + min-heap)',
      'Non-overlapping interval removal (greedy)',
    ],
    template: `# Merge intervals
def merge(intervals):
    intervals.sort()
    merged = [intervals[0]]
    for start, end in intervals[1:]:
        if start <= merged[-1][1]:
            merged[-1][1] = max(merged[-1][1], end)
        else:
            merged.append([start, end])
    return merged

# Min meeting rooms (heap tracks end times)
import heapq
def min_rooms(intervals):
    intervals.sort()
    heap = []   # end times of active meetings
    for start, end in intervals:
        if heap and heap[0] <= start:
            heapq.heapreplace(heap, end)
        else:
            heapq.heappush(heap, end)
    return len(heap)`,
    relatedPatterns: ['greedy', 'heap', 'sorting'],
    complexity: { time: 'O(n log n)', space: 'O(n)' },
  },
]

// Fast lookup by id
export const patternById = Object.fromEntries(patterns.map(p => [p.id, p]))
