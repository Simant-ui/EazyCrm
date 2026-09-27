"use client";

import React, { useState, useEffect } from "react";
import { AppLayout } from "@/components/layout/AppLayout";
import {
  Package,
  Plus,
  Search,
  Tag,
  DollarSign,
  Award,
  Layers,
  Edit2,
  CheckCircle2,
  XCircle,
  Database,
  RefreshCw,
  X,
} from "lucide-react";
import { formatCurrency } from "@/lib/utils";
import { toast } from "sonner";

export default function ProductsPage() {
  const [products, setProducts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("ALL");

  // Modal State for Add/Edit Product
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<any>(null);
  const [formData, setFormData] = useState({
    name: "",
    sku: "",
    category: "Hardware",
    costPrice: 0,
    sellingPrice: 9000,
    unitCommission: 500,
    stock: 20,
    description: "",
    status: "ACTIVE",
  });

  const loadProducts = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/products");
      const data = await res.json();
      setProducts(data.products || []);
    } catch (e) {
      toast.error("Failed to load products catalog");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadProducts();
  }, []);

  const handleOpenAdd = () => {
    setEditingProduct(null);
    setFormData({
      name: "",
      sku: `EZ-PROD-${Math.floor(100 + Math.random() * 900)}`,
      category: "Hardware",
      costPrice: 5000,
      sellingPrice: 9000,
      unitCommission: 500,
      stock: 20,
      description: "",
      status: "ACTIVE",
    });
    setIsModalOpen(true);
  };

  const handleOpenEdit = (p: any) => {
    setEditingProduct(p);
    setFormData({
      name: p.name,
      sku: p.sku,
      category: p.category || "Hardware",
      costPrice: p.costPrice || 0,
      sellingPrice: p.sellingPrice || 0,
      unitCommission: p.unitCommission || 500,
      stock: p.stock || 0,
      description: p.description || "",
      status: p.status || "ACTIVE",
    });
    setIsModalOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (editingProduct) {
        // Edit Product PUT
        const res = await fetch("/api/products", {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ _id: editingProduct._id, ...formData }),
        });
        if (res.ok) {
          toast.success(`Product '${formData.name}' updated!`);
          setIsModalOpen(false);
          loadProducts();
        } else {
          toast.error("Failed to update product");
        }
      } else {
        // Add Product POST
        const res = await fetch("/api/products", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(formData),
        });
        const data = await res.json();
        if (res.ok) {
          toast.success(`Product '${formData.name}' added to MongoDB!`);
          setIsModalOpen(false);
          loadProducts();
        } else {
          toast.error(data.error || "Failed to create product");
        }
      }
    } catch (err) {
      toast.error("Error saving product details");
    }
  };

  // Filtered Products
  const filteredProducts = products.filter((p) => {
    const matchesSearch =
      p.name.toLowerCase().includes(search.toLowerCase()) ||
      p.sku.toLowerCase().includes(search.toLowerCase()) ||
      p.category.toLowerCase().includes(search.toLowerCase());

    const matchesCat = selectedCategory === "ALL" || p.category === selectedCategory;
    return matchesSearch && matchesCat;
  });

  const categories = Array.from(new Set(products.map((p) => p.category || "Hardware")));

  return (
    <AppLayout>
      <div className="space-y-6 pb-12">
        {/* Header Banner */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-6 rounded-2xl bg-card border border-border shadow-sm">
          <div>
            <h2 className="text-2xl font-extrabold text-foreground tracking-tight flex items-center gap-2">
              Products & Pricing Catalog
              <Package size={22} className="text-emerald-500" />
            </h2>
            <p className="text-xs text-muted-foreground mt-1">
              Manage product items, cost prices, selling rates, commission rules & stock in MongoDB.
            </p>
          </div>

          <button
            onClick={handleOpenAdd}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-emerald-600 text-white font-semibold text-xs shadow-md shadow-emerald-600/20 hover:bg-emerald-700 transition-colors"
          >
            <Plus size={16} /> Add New Product
          </button>
        </div>

        {/* Toolbar & Filter Controls */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 p-4 rounded-2xl bg-card border border-border shadow-sm">
          {/* Search Box */}
          <div className="relative w-full sm:w-80">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search products by name, SKU..."
              className="w-full pl-9 pr-4 py-2 rounded-xl bg-background border border-input text-xs text-foreground focus:outline-none focus:ring-2 focus:ring-emerald-500"
            />
          </div>

          {/* Category Filter Pills */}
          <div className="flex flex-wrap items-center gap-2 w-full sm:w-auto">
            <button
              onClick={() => setSelectedCategory("ALL")}
              className={`px-3 py-1.5 rounded-xl text-xs font-medium transition-all ${
                selectedCategory === "ALL"
                  ? "bg-emerald-600 text-white shadow-sm font-semibold"
                  : "bg-accent/60 hover:bg-accent text-muted-foreground"
              }`}
            >
              All Products ({products.length})
            </button>
            {categories.map((cat) => (
              <button
                key={cat}
                onClick={() => setSelectedCategory(cat)}
                className={`px-3 py-1.5 rounded-xl text-xs font-medium transition-all ${
                  selectedCategory === cat
                    ? "bg-emerald-600 text-white shadow-sm font-semibold"
                    : "bg-accent/60 hover:bg-accent text-muted-foreground"
                }`}
              >
                {cat}
              </button>
            ))}
          </div>
        </div>

        {/* Products Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredProducts.map((p) => (
            <div
              key={p._id}
              className="p-5 rounded-2xl bg-card border border-border shadow-sm space-y-4 hover:border-emerald-500/50 transition-all flex flex-col justify-between"
            >
              <div>
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <span className="inline-block px-2 py-0.5 rounded-md bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 font-semibold text-[10px] tracking-wider uppercase mb-1">
                      {p.category}
                    </span>
                    <h3 className="font-bold text-base text-foreground leading-tight">{p.name}</h3>
                    <p className="text-[11px] text-muted-foreground font-mono mt-0.5">SKU: {p.sku}</p>
                  </div>
                  <button
                    onClick={() => handleOpenEdit(p)}
                    className="p-1.5 rounded-lg text-muted-foreground hover:text-emerald-600 hover:bg-emerald-500/10 transition-colors"
                    title="Edit Product"
                  >
                    <Edit2 size={16} />
                  </button>
                </div>

                <p className="text-xs text-muted-foreground mt-3 line-clamp-2">
                  {p.description || "No description specified."}
                </p>
              </div>

              <div className="space-y-3 pt-3 border-t border-border/60">
                {/* Price & Commission Info Grid */}
                <div className="grid grid-cols-2 gap-2 text-xs">
                  <div className="p-2.5 rounded-xl bg-accent/40 border border-border/50">
                    <span className="text-[10px] text-muted-foreground font-medium block">Catalog Selling Price</span>
                    <span className="font-bold text-emerald-600 dark:text-emerald-400 text-sm">
                      {formatCurrency(p.sellingPrice)}
                    </span>
                  </div>

                  <div className="p-2.5 rounded-xl bg-accent/40 border border-border/50">
                    <span className="text-[10px] text-muted-foreground font-medium block">Unit Commission</span>
                    <span className="font-bold text-foreground text-sm">
                      {formatCurrency(p.unitCommission)}
                    </span>
                  </div>
                </div>

                <div className="flex items-center justify-between text-xs pt-1 text-muted-foreground">
                  <span>Stock Quantity: <strong className="text-foreground">{p.stock} Units</strong></span>
                  <span className={`font-semibold ${p.status === "ACTIVE" ? "text-emerald-500" : "text-rose-500"}`}>
                    {p.status}
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Add / Edit Product Modal */}
        {isModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-background/80 backdrop-blur-sm animate-in fade-in duration-200">
            <div className="relative w-full max-w-lg bg-card border border-border rounded-2xl shadow-2xl overflow-hidden">
              <div className="flex items-center justify-between px-6 py-4 border-b border-border bg-card-elevated">
                <h3 className="font-bold text-base text-foreground">
                  {editingProduct ? "Edit Product Pricing" : "Add Product to Catalog"}
                </h3>
                <button
                  onClick={() => setIsModalOpen(false)}
                  className="p-1 rounded-lg text-muted-foreground hover:text-foreground hover:bg-accent"
                >
                  <X size={18} />
                </button>
              </div>

              <form onSubmit={handleSubmit} className="p-6 space-y-4 text-xs">
                <div>
                  <label className="block font-medium text-foreground mb-1">Product Name *</label>
                  <input
                    type="text"
                    required
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    placeholder="e.g. EazyBox POS Hardware Kit"
                    className="w-full px-3 py-2 rounded-xl bg-background border border-input text-foreground text-xs focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block font-medium text-foreground mb-1">SKU Code *</label>
                    <input
                      type="text"
                      required
                      value={formData.sku}
                      onChange={(e) => setFormData({ ...formData, sku: e.target.value })}
                      className="w-full px-3 py-2 rounded-xl bg-background border border-input text-foreground text-xs focus:outline-none focus:ring-2 focus:ring-emerald-500"
                    />
                  </div>

                  <div>
                    <label className="block font-medium text-foreground mb-1">Category</label>
                    <select
                      value={formData.category}
                      onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                      className="w-full px-3 py-2 rounded-xl bg-background border border-input text-foreground text-xs focus:outline-none focus:ring-2 focus:ring-emerald-500"
                    >
                      <option value="Hardware">Hardware</option>
                      <option value="Software">Software</option>
                      <option value="Accessories">Accessories</option>
                      <option value="Services">Services</option>
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block font-medium text-foreground mb-1">Catalog Selling Price (Rs.) *</label>
                    <input
                      type="number"
                      required
                      value={formData.sellingPrice}
                      onChange={(e) => setFormData({ ...formData, sellingPrice: Number(e.target.value) })}
                      className="w-full px-3 py-2 rounded-xl bg-background border border-input text-foreground text-xs font-bold text-emerald-600 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                    />
                  </div>

                  <div>
                    <label className="block font-medium text-foreground mb-1">Unit Commission (Rs.) *</label>
                    <input
                      type="number"
                      required
                      value={formData.unitCommission}
                      onChange={(e) => setFormData({ ...formData, unitCommission: Number(e.target.value) })}
                      className="w-full px-3 py-2 rounded-xl bg-background border border-input text-foreground text-xs font-bold focus:outline-none focus:ring-2 focus:ring-emerald-500"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block font-medium text-foreground mb-1">Cost Price (Rs.)</label>
                    <input
                      type="number"
                      value={formData.costPrice}
                      onChange={(e) => setFormData({ ...formData, costPrice: Number(e.target.value) })}
                      className="w-full px-3 py-2 rounded-xl bg-background border border-input text-foreground text-xs focus:outline-none focus:ring-2 focus:ring-emerald-500"
                    />
                  </div>

                  <div>
                    <label className="block font-medium text-foreground mb-1">Stock Quantity</label>
                    <input
                      type="number"
                      value={formData.stock}
                      onChange={(e) => setFormData({ ...formData, stock: Number(e.target.value) })}
                      className="w-full px-3 py-2 rounded-xl bg-background border border-input text-foreground text-xs focus:outline-none focus:ring-2 focus:ring-emerald-500"
                    />
                  </div>
                </div>

                <div>
                  <label className="block font-medium text-foreground mb-1">Description / Notes</label>
                  <textarea
                    rows={2}
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    placeholder="Brief description of hardware or software features..."
                    className="w-full px-3 py-2 rounded-xl bg-background border border-input text-foreground text-xs focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  />
                </div>

                <div className="flex items-center justify-end gap-3 pt-3 border-t border-border">
                  <button
                    type="button"
                    onClick={() => setIsModalOpen(false)}
                    className="px-4 py-2 rounded-xl border border-border text-foreground text-xs font-semibold hover:bg-accent"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-5 py-2 rounded-xl bg-emerald-600 text-white text-xs font-semibold hover:bg-emerald-700 shadow-md shadow-emerald-600/20"
                  >
                    {editingProduct ? "Update Product" : "Save Product to MongoDB"}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </AppLayout>
  );
}
