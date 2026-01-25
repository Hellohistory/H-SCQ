const std = @import("std");

const Pixel = struct {
    r: u8,
    g: u8,
    b: u8,
};

const PaletteEntry = extern struct {
    r: u8,
    g: u8,
    b: u8,
    _padding: u8,
    count: u32,
};

const OctreeNode = struct {
    r_sum: u64,
    g_sum: u64,
    b_sum: u64,
    pixel_count: u64,
    children: [8]?*OctreeNode,
    is_leaf: bool,
};

const MAX_NODES = 25000;
var node_pool: [MAX_NODES]OctreeNode = undefined;
var node_idx: usize = 0;

const MAX_PALETTE_SIZE = 1000;
var palette_buffer: [MAX_PALETTE_SIZE]PaletteEntry = undefined;
var palette_count: usize = 0;

fn arena_reset() void {
    node_idx = 0;
    palette_count = 0;
}

fn arena_alloc() ?*OctreeNode {
    if (node_idx >= MAX_NODES) return null;
    const node = &node_pool[node_idx];
    node_idx += 1;
    node.* = std.mem.zeroInit(OctreeNode, .{});
    return node;
}

fn get_color_octant(r: u8, g: u8, b: u8, depth: u3) usize {
    const shift: u3 = 7 - depth;
    var octant: usize = 0;
    if ((r >> shift) & 1 == 1) octant |= 1;
    if ((g >> shift) & 1 == 1) octant |= 2;
    if ((b >> shift) & 1 == 1) octant |= 4;
    return octant;
}

fn insert_color(node: *OctreeNode, p: Pixel, depth: u3) void {
    node.r_sum += p.r;
    node.g_sum += p.g;
    node.b_sum += p.b;
    node.pixel_count += 1;

    if (depth >= 4) {
        node.is_leaf = true;
        return;
    }

    const octant = get_color_octant(p.r, p.g, p.b, depth);

    if (node.children[octant] == null) {
        node.children[octant] = arena_alloc();
    }

    if (node.children[octant]) |child| {
        insert_color(child, p, depth + 1);
    }
}

fn extract_palette(node: *OctreeNode) void {
    var is_leaf_logic = node.is_leaf;
    if (!is_leaf_logic) {
        var has_children = false;
        for (node.children) |child| {
            if (child != null) {
                has_children = true;
                break;
            }
        }
        if (!has_children) is_leaf_logic = true;
    }

    if (is_leaf_logic) {
        if (node.pixel_count > 0 and palette_count < MAX_PALETTE_SIZE) {
            palette_buffer[palette_count] = PaletteEntry{
                .r = @intCast(node.r_sum / node.pixel_count),
                .g = @intCast(node.g_sum / node.pixel_count),
                .b = @intCast(node.b_sum / node.pixel_count),
                ._padding = 0,
                .count = @intCast(node.pixel_count),
            };
            palette_count += 1;
        }
        return;
    }

    for (node.children) |child_opt| {
        if (child_opt) |child| extract_palette(child);
    }
}

export fn get_result_pointer() [*]PaletteEntry {
    return &palette_buffer;
}

export fn run_octree() usize {
    arena_reset();

    const root_opt = arena_alloc();
    if (root_opt == null) return 0;
    const root = root_opt.?;

    const width: usize = 256;
    const height: usize = 256;

    var y: usize = 0;
    while (y < height) : (y += 1) {
        var x: usize = 0;
        while (x < width) : (x += 1) {
            var p: Pixel = undefined;
            const t: f32 = @as(f32, @floatFromInt(y)) / @as(f32, @floatFromInt(height));

            if (t < 0.5) {
                const local_t = t * 2.0;
                p.r = @intFromFloat(local_t * 255.0);
                p.g = 0;
                p.b = @intFromFloat((1.0 - local_t) * 255.0);
            } else {
                const local_t = (t - 0.5) * 2.0;
                p.r = 255;
                p.g = @intFromFloat(local_t * 255.0);
                p.b = 0;
            }

            insert_color(root, p, 0);
        }
    }

    extract_palette(root);
    return palette_count;
}
