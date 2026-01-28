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

const MAX_IMAGE_BYTES = 8 * 1024 * 1024;
var image_buffer: [MAX_IMAGE_BYTES]u8 = undefined;

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

export fn alloc_image_buffer(size: usize) usize {
    if (size > MAX_IMAGE_BYTES) return 0;
    return @intFromPtr(&image_buffer);
}

export fn run_octree(image_ptr: usize, image_len: usize) usize {
    arena_reset();

    if (image_ptr == 0 or image_len == 0) return 0;

    const root_opt = arena_alloc();
    if (root_opt == null) return 0;
    const root = root_opt.?;

    const bytes = @as([*]const u8, @ptrFromInt(image_ptr))[0..image_len];
    const pixel_count = bytes.len / 4;

    var idx: usize = 0;
    while (idx < pixel_count) : (idx += 1) {
        const base = idx * 4;
        const p = Pixel{
            .r = bytes[base + 0],
            .g = bytes[base + 1],
            .b = bytes[base + 2],
        };
        insert_color(root, p, 0);
    }

    extract_palette(root);
    return palette_count;
}
