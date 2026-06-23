import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { supabase } from "@/integrations/supabase/client";
import { 
  Database, 
  Trash2, 
  Image as ImageIcon,
  Loader2,
  Search,
  Upload,
  RefreshCw,
  HardDrive,
  Check,
  X,
  FileImage,
  Edit2
} from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useRef } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";

interface LibraryImage {
  id: string;
  image_url: string;
  item_name: string;
  category_name: string | null;
  source: string;
  created_at: string;
  usage_count?: number;
}

export default function StorageManager() {
  const [images, setImages] = useState<LibraryImage[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [search, setSearch] = useState("");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editName, setEditName] = useState("");
  const { toast } = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const bulkFileInputRef = useRef<HTMLInputElement>(null);
  const editFileInputRef = useRef<HTMLInputElement>(null);

  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [editingImage, setEditingImage] = useState<LibraryImage | null>(null);
  const [editForm, setEditForm] = useState({ item_name: "", category_name: "" });

  const fetchImages = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('image_library')
        .select('*, image_usage(count)')
        .order('created_at', { ascending: false });

      if (error) throw error;
      
      const formattedData = (data || []).map(img => ({
        ...img,
        usage_count: img.image_usage?.[0]?.count || 0
      }));
      
      setImages(formattedData);
    } catch (error: any) {
      console.error('Error fetching images:', error);
      toast({
        title: "Error loading storage",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchImages();
  }, []);

  const handleDelete = async (id: string, url: string) => {
    if (!window.confirm("Are you sure you want to delete this image from the shared library?")) return;

    try {
      if (url.includes('supabase.co/storage/v1/object/public/item-images/')) {
        const path = url.split('item-images/')[1];
        if (path) {
          await supabase.storage.from('item-images').remove([path]);
        }
      }

      const { error } = await supabase.from('image_library').delete().eq('id', id);
      if (error) throw error;

      toast({ title: "Image deleted successfully" });
      fetchImages();
    } catch (error: any) {
      console.error('Delete error:', error);
      toast({
        title: "Delete failed",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const handleUpdateName = async (id: string) => {
    if (!editName.trim()) return;
    
    try {
      const { error } = await supabase
        .from('image_library')
        .update({ item_name: editName })
        .eq('id', id);
        
      if (error) throw error;
      
      toast({ title: "Name updated successfully" });
      setEditingId(null);
      fetchImages();
    } catch (error: any) {
      console.error('Update error:', error);
      toast({
        title: "Update failed",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const handleEditSave = async () => {
    if (!editingImage) return;
    if (!editForm.item_name.trim()) {
      toast({ title: "Name is required", variant: "destructive" });
      return;
    }
    
    setUploading(true);
    try {
      const { error } = await supabase
        .from('image_library')
        .update({ 
          item_name: editForm.item_name,
          category_name: editForm.category_name 
        })
        .eq('id', editingImage.id);
        
      if (error) throw error;
      
      toast({ title: "Image details updated" });
      setIsEditDialogOpen(false);
      fetchImages();
    } catch (error: any) {
      toast({ title: "Update failed", description: error.message, variant: "destructive" });
    } finally {
      setUploading(false);
    }
  };

  const handleEditFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    if (!editingImage) return;
    const file = event.target.files?.[0];
    if (!file) return;

    setUploading(true);
    try {
      // Upload new image
      const fileExt = file.name.split('.').pop();
      const fileName = `${Math.random().toString(36).substring(2)}_${Date.now()}.${fileExt}`;
      const filePath = `manual/${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from('item-images')
        .upload(filePath, file);

      if (uploadError) throw uploadError;

      const { data: publicUrlData } = supabase.storage
        .from('item-images')
        .getPublicUrl(filePath);

      // Update DB record
      const { error: dbError } = await supabase
        .from('image_library')
        .update({ 
          image_url: publicUrlData.publicUrl,
          source: 'upload' 
        })
        .eq('id', editingImage.id);

      if (dbError) throw dbError;

      toast({ title: "Image file replaced successfully" });
      setEditingImage({ ...editingImage, image_url: publicUrlData.publicUrl });
      fetchImages();
    } catch (error: any) {
      toast({ title: "Upload failed", description: error.message, variant: "destructive" });
    } finally {
      setUploading(false);
      if (editFileInputRef.current) editFileInputRef.current.value = '';
    }
  };

  const handleUploadClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setUploading(true);
    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `${Math.random().toString(36).substring(2)}_${Date.now()}.${fileExt}`;
      const filePath = `manual/${fileName}`;

      const { error: uploadError, data } = await supabase.storage
        .from('item-images')
        .upload(filePath, file);

      if (uploadError) throw uploadError;

      const { data: publicUrlData } = supabase.storage
        .from('item-images')
        .getPublicUrl(filePath);

      const { error: dbError } = await supabase.from('image_library').insert({
        image_url: publicUrlData.publicUrl,
        item_name: file.name.split('.')[0],
        category_name: 'Uploads',
        source: 'upload'
      });

      if (dbError) throw dbError;

      toast({ title: "Image uploaded successfully" });
      fetchImages();
    } catch (error: any) {
      console.error('Upload error:', error);
      toast({
        title: "Upload failed",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const handleBulkUploadClick = () => {
    bulkFileInputRef.current?.click();
  };

  const handleBulkFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (!files || files.length === 0) return;

    setUploading(true);
    let successCount = 0;
    try {
      for (let i = 0; i < files.length; i++) {
        const file = files[i];
        
        // Extract category and name from webkitRelativePath if available (e.g., "Category/Item_Name.jpg")
        let category = 'Uploads';
        let itemName = file.name.split('.')[0];
        
        if (file.webkitRelativePath && file.webkitRelativePath.includes('/')) {
          const parts = file.webkitRelativePath.split('/');
          if (parts.length >= 2) {
            category = parts[parts.length - 2];
            itemName = parts[parts.length - 1].split('.')[0];
          }
        }
        
        // Clean up item name (remove underscores, dashes)
        itemName = itemName.replace(/[_-]/g, ' ');
        // Title case
        itemName = itemName.replace(/\b\w/g, l => l.toUpperCase());

        const fileExt = file.name.split('.').pop();
        const fileName = `${Math.random().toString(36).substring(2)}_${Date.now()}.${fileExt}`;
        
        // Auto-rename path: Category/Item_Name_hash.jpg
        const sanitizedCat = category.replace(/[^a-zA-Z0-9]/g, '');
        const sanitizedName = itemName.replace(/[^a-zA-Z0-9]/g, '');
        const filePath = `auto/${sanitizedCat}/${sanitizedName}_${fileName}`;

        const { error: uploadError } = await supabase.storage
          .from('item-images')
          .upload(filePath, file);

        if (uploadError) throw uploadError;

        const { data: publicUrlData } = supabase.storage
          .from('item-images')
          .getPublicUrl(filePath);

        const { error: dbError } = await supabase.from('image_library').insert({
          image_url: publicUrlData.publicUrl,
          item_name: itemName,
          category_name: category,
          source: 'upload'
        });

        if (dbError) throw dbError;
        successCount++;
      }

      toast({ title: `${successCount} images uploaded successfully` });
      fetchImages();
    } catch (error: any) {
      console.error('Bulk upload error:', error);
      toast({
        title: "Bulk upload failed",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setUploading(false);
      if (bulkFileInputRef.current) bulkFileInputRef.current.value = '';
    }
  };

  const filteredImages = images.filter(img => 
    img.item_name?.toLowerCase().includes(search.toLowerCase()) ||
    img.category_name?.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-6"
    >
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="p-3 bg-primary/10 text-primary rounded-xl">
            <Database className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-2xl font-bold tracking-tight">Shared Image Library</h1>
            <p className="text-muted-foreground text-sm">Manage global item images across all tenants</p>
          </div>
        </div>
        
        <div className="flex items-center gap-2">
          <Button variant="outline" onClick={fetchImages}>
            <RefreshCw className={`w-4 h-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
          <input 
            type="file" 
            ref={fileInputRef}
            onChange={handleFileUpload}
            accept="image/*"
            className="hidden"
          />
          <input 
            type="file" 
            ref={bulkFileInputRef}
            onChange={handleBulkFileUpload}
            accept="image/*"
            multiple
            // @ts-expect-error - webkitdirectory is non-standard but widely supported
            webkitdirectory="true"
            className="hidden"
          />
          <Button className="gap-2" variant="secondary" onClick={handleBulkUploadClick} disabled={uploading}>
            {uploading ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <FileImage className="w-4 h-4" />
            )}
            Folder Upload
          </Button>
          <Button className="gap-2" onClick={handleUploadClick} disabled={uploading}>
            {uploading ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Upload className="w-4 h-4" />
            )}
            {uploading ? "Uploading..." : "Upload Image"}
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Library Images</CardTitle>
            <ImageIcon className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{images.length}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">AI Generated</CardTitle>
            <HardDrive className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {images.filter(i => i.source === 'ai').length}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Manual Uploads</CardTitle>
            <Upload className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {images.filter(i => i.source === 'upload').length}
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>Image Assets</CardTitle>
            <div className="relative w-64">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search images..."
                className="pl-8"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-[100px]">Preview</TableHead>
                  <TableHead>Item Name</TableHead>
                  <TableHead>Category</TableHead>
                  <TableHead>Source</TableHead>
                  <TableHead>Usage</TableHead>
                  <TableHead>Added On</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loading ? (
                  <TableRow>
                    <TableCell colSpan={6} className="h-24 text-center">
                      <Loader2 className="h-6 w-6 animate-spin mx-auto text-muted-foreground" />
                    </TableCell>
                  </TableRow>
                ) : filteredImages.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} className="h-24 text-center text-muted-foreground">
                      No images found.
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredImages.map((img) => (
                    <TableRow key={img.id}>
                      <TableCell>
                        <div className="h-12 w-12 rounded-md overflow-hidden bg-muted">
                          <img 
                            src={img.image_url} 
                            alt={img.item_name}
                            className="h-full w-full object-cover"
                            loading="lazy"
                          />
                        </div>
                      </TableCell>
                      <TableCell className="font-medium">
                        {img.item_name}
                      </TableCell>
                      <TableCell>{img.category_name || '-'}</TableCell>
                      <TableCell>
                        <Badge variant="secondary" className="uppercase text-[10px]">
                          {img.source}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1.5 text-muted-foreground">
                          <Database className="w-3.5 h-3.5" />
                          <span className="text-sm">{img.usage_count || 0}</span>
                        </div>
                      </TableCell>
                      <TableCell className="text-muted-foreground text-sm">
                        {new Date(img.created_at).toLocaleDateString()}
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-2">
                          <Button 
                            variant="ghost" 
                            size="icon"
                            className="text-blue-600 hover:bg-blue-50"
                            onClick={() => {
                              setEditingImage(img);
                              setEditForm({ item_name: img.item_name || "", category_name: img.category_name || "" });
                              setIsEditDialogOpen(true);
                            }}
                          >
                            <Edit2 className="h-4 w-4" />
                          </Button>
                          <Button 
                            variant="ghost" 
                            size="icon"
                            className="text-destructive hover:bg-destructive/10"
                            onClick={() => handleDelete(img.id, img.image_url)}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Edit Image Details</DialogTitle>
          </DialogHeader>
          {editingImage && (
            <div className="space-y-6 py-4">
              <div className="flex justify-center">
                <div className="relative group rounded-xl overflow-hidden bg-muted w-40 h-40 border">
                  <img src={editingImage.image_url} alt="Preview" className="w-full h-full object-cover" />
                  <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                    <Button variant="secondary" size="sm" onClick={() => editFileInputRef.current?.click()} disabled={uploading}>
                      {uploading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Upload className="h-4 w-4 mr-2" />}
                      Replace Image
                    </Button>
                  </div>
                </div>
                <input 
                  type="file" 
                  ref={editFileInputRef}
                  onChange={handleEditFileUpload}
                  accept="image/*"
                  className="hidden"
                />
              </div>

              <div className="space-y-4">
                <div className="space-y-2">
                  <Label>Item Name</Label>
                  <Input 
                    value={editForm.item_name} 
                    onChange={e => setEditForm({ ...editForm, item_name: e.target.value })} 
                  />
                </div>
                <div className="space-y-2">
                  <Label>Category</Label>
                  <Input 
                    value={editForm.category_name} 
                    onChange={e => setEditForm({ ...editForm, category_name: e.target.value })} 
                  />
                </div>
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsEditDialogOpen(false)}>Cancel</Button>
            <Button onClick={handleEditSave} disabled={uploading}>
              {uploading ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : null}
              Save Changes
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </motion.div>
  );
}
