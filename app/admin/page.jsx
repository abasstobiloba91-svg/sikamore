/* eslint-disable @next/next/no-img-element */
'use client';
export const dynamic = 'force-dynamic';

import { useState, useEffect, useRef } from 'react';
import { createClient } from '@supabase/supabase-js';
import Link from 'next/link';
import { useApp } from '../providers';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';
const supabase = createClient(supabaseUrl, supabaseAnonKey);

// THE ADMIN URL MAGNET: Completely bypasses nested brackets/arrays from the DB to guarantee a valid image source
const extractCleanUrls = (imgPayload) => {
  if (!imgPayload) return [];
  try {
    // Flatten any weird DB structure into a pure string
    const rawString = typeof imgPayload === 'string' ? imgPayload : JSON.stringify(imgPayload);
    // Magnetically pull ONLY valid URLs, ignoring all quotes, slashes, and brackets
    const matches = rawString.match(/https?:\/\/[^"\\\[\]{}\s]+/g);
    // Strip trailing commas just in case
    return matches ? matches.map(url => url.replace(/,+$/, '')) : [];
  } catch (e) {
    return [];
  }
};

// Gets strictly the first image for the grid thumbnails
const getPrimaryImage = (imgPayload) => {
  const urls = extractCleanUrls(imgPayload);
  return urls.length > 0 ? urls : '';
};

export default function AdminDashboard() {
  const { showToast } = useApp();
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [passcode, setPasscode] = useState('');
  const [activeTab, setActiveTab] = useState('inventory');
  
  // INVENTORY STATES
  const [inventoryMode, setInventoryMode] = useState('manage'); 
  const [liveProducts, setLiveProducts] = useState([]);
  const [editingProduct, setEditingProduct] = useState(null);
  
  // MULTI-IMAGE STATES
  const [editFiles, setEditFiles] = useState([]);
  const [editPreviews, setEditPreviews] = useState([]);
  const [isUpdating, setIsUpdating] = useState(false);

  const [productsList, setProductsList] = useState([
    { id: Date.now(), name: '', price: '', stock: '', description: '', additional_information: '', store_policies: '', inquiries: '', files: [], previews: [] }
  ]);
  const [disabled, setDisabled] = useState(false);

  const [orders, setOrders] = useState([]);
  const [subscribers, setSubscribers] = useState([]);
  const [campaigns, setCampaigns] = useState([]);
  const [tickets, setTickets] = useState([]);
  const [vendors, setVendors] = useState([]);
  const [vendorOrders, setVendorOrders] = useState([]);
  const [analyticsData, setAnalyticsData] = useState([]);
  
  const [activeVendor, setActiveVendor] = useState(null);
  const [activeChat, setActiveChat] = useState(null);
  const [replyText, setReplyText] = useState('');
  const [sendingReply, setSendingReply] = useState(false);

  const [interceptedOrder, setInterceptedOrder] = useState(null);
  const [deliveryDays, setDeliveryDays] = useState('');
  
  const [isUserTyping, setIsUserTyping] = useState(false);
  const typingChannelRef = useRef(null);
  const typingTimeoutRef = useRef(null);

  const [newsletterSubj, setNewsletterSubj] = useState('');
  const [newsletterMsg, setNewsletterMsg] = useState('');
  const [sendingNewsletter, setSendingNewsletter] = useState(false);

  const chatEndRef = useRef(null);
  const ADMIN_PASSCODE = 'SIKAMORE-ADMIN';

  useEffect(() => {
    if (localStorage.getItem('sikamore_admin_authenticated') === 'true') {
      setIsAuthenticated(true);
    }
  }, []);

  useEffect(() => {
    if (!isAuthenticated) return;

    async function loadMasterData() {
      try {
        const { data: oData } = await supabase.from('orders').select('*').order('created_at', { ascending: false });
        if (oData) setOrders(oData);
      } catch(e){}

      try {
        const { data: sData } = await supabase.from('subscribers').select('*').order('created_at', { ascending: false });
        if (sData) setSubscribers(sData);
      } catch(e){}

      try {
        const { data: cData } = await supabase.from('campaigns').select('*').order('created_at', { ascending: false });
        if (cData) setCampaigns(cData);
      } catch(e){}

      try {
        const { data: tData } = await supabase.from('support_tickets').select('*').order('created_at', { ascending: false });
        if (tData) setTickets(tData);
      } catch(e){}

      try {
        const { data: vData } = await supabase.from('vendors').select('*').order('name', { ascending: true });
        if (vData) setVendors(vData);
      } catch(e){}

      try {
        const { data: aData } = await supabase.from('page_analytics').select('*').order('created_at', { ascending: false });
        if (aData) setAnalyticsData(aData);
      } catch(e){}

      try {
        const { data: pData } = await supabase.from('products').select('*').order('created_at', { ascending: false });
        if (pData) setLiveProducts(pData);
      } catch(e){}
    }
    loadMasterData();
  }, [isAuthenticated]);

  useEffect(() => {
    if (!isAuthenticated) return;

    const masterSync = supabase.channel('admin_global_network')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'orders' }, (payload) => {
        if (payload.eventType === 'INSERT') setOrders(prev => [payload.new, ...prev]);
        if (payload.eventType === 'UPDATE') setOrders(prev => prev.map(o => o.id === payload.new.id ? payload.new : o));
      })
      .on('postgres_changes', { event: '*', schema: 'public', table: 'support_tickets' }, (payload) => {
        if (payload.eventType === 'INSERT') setTickets(prev => [payload.new, ...prev]);
        if (payload.eventType === 'UPDATE') {
          setTickets(prev => prev.map(t => t.id === payload.new.id ? payload.new : t));
          setActiveChat(prev => prev?.id === payload.new.id ? payload.new : prev);
        }
      })
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'page_analytics' }, (payload) => {
        setAnalyticsData(prev => [payload.new, ...prev]);
      })
      .on('postgres_changes', { event: '*', schema: 'public', table: 'products' }, (payload) => {
        if (payload.eventType === 'INSERT') setLiveProducts(prev => [payload.new, ...prev]);
        if (payload.eventType === 'UPDATE') setLiveProducts(prev => prev.map(p => p.id === payload.new.id ? payload.new : p));
        if (payload.eventType === 'DELETE') setLiveProducts(prev => prev.filter(p => p.id !== payload.old.id));
      })
      .subscribe();

    return () => {
      supabase.removeChannel(masterSync);
    };
  }, [isAuthenticated]);

  useEffect(() => {
    if (!activeChat) return;
    const channel = supabase.channel(`typing_support_${activeChat.id}`);
    typingChannelRef.current = channel;

    channel.on('broadcast', { event: 'typing' }, (payload) => {
      if (payload.payload.sender !== 'admin') {
        setIsUserTyping(payload.payload.isTyping);
        if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
        if (payload.payload.isTyping) {
          typingTimeoutRef.current = setTimeout(() => setIsUserTyping(false), 3000);
        }
      }
    }).subscribe();

    return () => {
      supabase.removeChannel(channel);
      if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
      typingChannelRef.current = null;
    };
  }, [activeChat?.id]);

  useEffect(() => {
    if (activeVendor) {
      async function fetchVendorOrderHistory() {
        const { data } = await supabase.from('orders').select('*').eq('customer_email', activeVendor.email).order('created_at', { ascending: false });
        if (data) setVendorOrders(data);
      }
      fetchVendorOrderHistory();
    }
  }, [activeVendor]);

  useEffect(() => {
    if (activeChat && chatEndRef.current) chatEndRef.current.scrollIntoView({ behavior: 'smooth' });
  }, [activeChat]);

  const handleLogin = (e) => {
    e.preventDefault();
    if (passcode === ADMIN_PASSCODE) {
      setIsAuthenticated(true);
      localStorage.setItem('sikamore_admin_authenticated', 'true');
      showToast('ACCESS GRANTED. SYSTEM ALIGNED.');
    } else {
      showToast('ACCESS DENIED.');
      setPasscode('');
    }
  };

  const handleLogout = () => {
    setIsAuthenticated(false);
    localStorage.removeItem('sikamore_admin_authenticated');
    showToast('PORTAL LOCKED.');
  };

  // ====================== INVENTORY: DEPLOY NEW (SEQUENTIAL UPLOAD FIX) ====================== //
  const addProductRow = () => {
    setProductsList(prev => [...prev, { id: Date.now() + Math.random(), name: '', price: '', stock: '', description: '', additional_information: '', store_policies: '', inquiries: '', files: [], previews: [] }]);
  };

  const removeProductRow = (id) => {
    setProductsList(prev => prev.filter(p => p.id !== id));
  };

  const updateProductData = (id, field, value) => {
    setProductsList(prev => prev.map(p => p.id === id ? { ...p, [field]: value } : p));
  };

  const handleImageChange = (id, e) => {
    const selectedFiles = Array.from(e.target.files).slice(0, 5); // Limit to 5 images
    if (selectedFiles.length > 0) {
      const previews = selectedFiles.map(file => URL.createObjectURL(file));
      setProductsList(prev => prev.map(p => p.id === id ? { ...p, files: selectedFiles, previews } : p));
    }
  };

  const handleBulkSubmit = async (e) => {
    e.preventDefault();
    setDisabled(true);

    try {
      let detailedError = '';
      productsList.forEach((product, index) => {
        if (detailedError) return;
        const itemNum = index + 1;
        if (!product.name || String(product.name).trim() === '') detailedError = `ITEM 0${itemNum} IS MISSING A PRODUCT NAME.`;
        else if (!product.price || String(product.price).trim() === '') detailedError = `ITEM 0${itemNum} (${product.name.toUpperCase()}) IS MISSING A PRICE.`;
        else if (!product.stock || String(product.stock).trim() === '') detailedError = `ITEM 0${itemNum} (${product.name.toUpperCase()}) IS MISSING A STOCK QUANTITY.`;
        else if (!product.files || product.files.length === 0) detailedError = `ITEM 0${itemNum} (${product.name.toUpperCase()}) IS MISSING ATTACHED IMAGES.`;
      });

      if (detailedError) {
        setDisabled(false);
        return showToast(`ERROR: ${detailedError}`);
      }

      showToast('UPLOADING IMAGES SEQUENTIALLY... PLEASE WAIT.');

      for (const product of productsList) {
        let imageUrls = [];
        
        // SEQUENTIAL UPLOAD: Processes one by one to prevent mobile network timeouts
        for (const file of product.files) {
          const fileExt = file.name.split('.').pop().toLowerCase();
          const fileName = `${Date.now()}-${Math.random().toString(36).substring(2)}.${fileExt}`;
          const safeContentType = file.type || `image/jpeg`;

          const { error: uploadError } = await supabase.storage.from('product-images').upload(fileName, file, { 
            cacheControl: '3600', 
            upsert: false, 
            contentType: safeContentType 
          });
          
          if (uploadError) throw new Error(uploadError.message || "Failed to upload image. Connection dropped.");
          
          const { data } = supabase.storage.from('product-images').getPublicUrl(fileName);
          imageUrls.push(data.publicUrl);
        }

        const { error: dbError } = await supabase.from('products').insert([{ 
          name: product.name.toUpperCase(), 
          price: parseFloat(product.price), 
          stock_quantity: parseInt(product.stock), 
          description: product.description || null, 
          additional_information: product.additional_information || null, 
          store_policies: product.store_policies || null, 
          inquiries: product.inquiries || null, 
          image: imageUrls, 
          is_sold_out: parseInt(product.stock) <= 0 
        }]);
        
        if (dbError) throw new Error(dbError.message);
      }

      showToast(`SUCCESS! ${productsList.length} PRODUCT(S) PUSHED TO STOREFRONT.`);
      setProductsList([{ id: Date.now(), name: '', price: '', stock: '', description: '', additional_information: '', store_policies: '', inquiries: '', files: [], previews: [] }]);
      setInventoryMode('manage'); 
    } catch (error) { 
      showToast(`UPLOAD ERROR: ${error.message.toUpperCase()}`); 
    } finally { 
      setDisabled(false); 
    }
  };

  const handleDeleteProduct = async (id) => {
    if (!window.confirm("ARE YOU SURE YOU WANT TO DELETE THIS ITEM? THIS CANNOT BE UNDONE.")) return;
    try {
      const { error } = await supabase.from('products').delete().eq('id', id);
      if (error) throw error;
      showToast("ITEM DELETED SUCCESSFULLY.");
    } catch (err) {
      showToast(`DELETE ERROR: ${err.message.toUpperCase()}`);
    }
  };

  const startEditingProduct = (product) => {
    setEditingProduct({ ...product });
    setEditFiles([]);
    setEditPreviews([]);
  };

  const handleEditImageChange = (e) => {
    const selectedFiles = Array.from(e.target.files).slice(0, 5);
    if (selectedFiles.length > 0) {
      setEditFiles(selectedFiles);
      setEditPreviews(selectedFiles.map(f => URL.createObjectURL(f)));
    }
  };

  const submitEditProduct = async (e) => {
    e.preventDefault();
    setIsUpdating(true);

    try {
      let finalImageUrls = extractCleanUrls(editingProduct.image);

      if (editFiles.length > 0) {
        finalImageUrls = []; 
        showToast('UPDATING IMAGES SEQUENTIALLY... PLEASE WAIT.');

        // SEQUENTIAL UPLOAD FOR EDITS TO PREVENT TIMEOUTS
        for (const file of editFiles) {
          const fileExt = file.name.split('.').pop().toLowerCase();
          const fileName = `${Date.now()}-${Math.random().toString(36).substring(2)}.${fileExt}`;
          const safeContentType = file.type || `image/jpeg`;

          const { error: uploadError } = await supabase.storage.from('product-images').upload(fileName, file, { 
            cacheControl: '3600', 
            upsert: false, 
            contentType: safeContentType 
          });
          
          if (uploadError) throw new Error(uploadError.message || "Failed to upload image. Connection dropped.");
          
          const { data } = supabase.storage.from('product-images').getPublicUrl(fileName);
          finalImageUrls.push(data.publicUrl);
        }
      }

      const { error: dbError } = await supabase.from('products').update({
        name: editingProduct.name.toUpperCase(),
        price: parseFloat(editingProduct.price),
        stock_quantity: parseInt(editingProduct.stock_quantity),
        description: editingProduct.description || null,
        additional_information: editingProduct.additional_information || null,
        store_policies: editingProduct.store_policies || null,
        inquiries: editingProduct.inquiries || null,
        image: finalImageUrls,
        is_sold_out: parseInt(editingProduct.stock_quantity) <= 0
      }).eq('id', editingProduct.id);

      if (dbError) throw new Error(dbError.message);

      showToast("PRODUCT UPDATED SUCCESSFULLY.");
      setEditingProduct(null);
      setEditFiles([]);
      setEditPreviews([]);
    } catch (error) {
      showToast(`UPDATE ERROR: ${error.message.toUpperCase()}`);
    } finally {
      setIsUpdating(false);
    }
  };

  // ====================== ORDERS WITH IMAGE_3 BLUEPRINT ====================== //
  const handleUpdateOrderStatus = async (orderId, currentStatus, estDelivery = null, orderData = null) => {
    try {
      setOrders(prev => prev.map(o => o.id === orderId ? { ...o, status: currentStatus, estimated_delivery: estDelivery } : o));
      const { error } = await supabase.from('orders').update({ status: currentStatus, estimated_delivery: estDelivery }).eq('id', orderId);
      if (error) throw error;
      
      showToast(`FULFILLMENT SWITCHED TO: ${currentStatus.toUpperCase()}`);
      setInterceptedOrder(null);
      setDeliveryDays('');

      if (orderData && (currentStatus === 'shipped' || currentStatus === 'delivered')) {
        const itemsHtml = orderData.items.map(i => `
          <tr>
            <td style="padding: 14px 0; border-bottom: 1px solid #1A1A1A; font-size: 10px; tracking: 0.15em; color: #E5E5E5;">${i.name.toUpperCase()} (${i.size}) x${i.quantity}</td>
            <td style="padding: 14px 0; border-bottom: 1px solid #1A1A1A; font-size: 10px; tracking: 0.15em; color: #FFFFFF; text-align: right; font-family: monospace;">₦${(i.price * i.quantity).toLocaleString()}</td>
          </tr>
        `).join('');
        
        if (orderData.customer_email) {
          let statusHeader = 'ORDER PROCESSING';
          let statusMessage = 'Your carefully curated acquisition is being prepared within our atelier.';
          
          if (currentStatus === 'shipped') {
            statusHeader = 'DISPATCH EN ROUTE';
            statusMessage = `Your parcel has left our central directory and is currently in transit. ${estDelivery ? `<br/><br/>ESTIMATED DELIVERY PORTAL:<br/><strong style="color: #FFFFFF; font-size: 12px; tracking: 0.2em;">${estDelivery.toUpperCase()}</strong>` : ''}`;
          } else if (currentStatus === 'delivered') {
            statusHeader = 'DELIVERY CONFIRMED';
            statusMessage = 'Our logistics ledger logs this parcel as successfully delivered. We hope you enjoy your new piece.';
          }

          const clientHtmlTemplate = `
            <!DOCTYPE html><html><head><meta charset="utf-8"></head>
            <body style="margin:0; padding:0; background-color:#000000; font-family:-apple-system, sans-serif;">
              <table width="100%" border="0" cellspacing="0" cellpadding="0" style="background-color:#000000; padding:40px 10px;">
                <tr><td align="center">
                  <table width="500" border="0" cellspacing="0" cellpadding="0" style="background-color:#0A0A0A; border:1px solid #1A1A1A; padding:40px; text-transform:uppercase; letter-spacing:0.15em; line-height:1.8;">
                    <tr><td align="center" style="padding-bottom:30px; border-bottom:1px solid #1A1A1A;"><h2 style="font-family:serif; letter-spacing:0.35em; font-size:16px; margin:0; color:#FFFFFF;">S. SIKAMÒRE</h2></td></tr>
                    <tr><td align="center" style="padding:40px 0 10px 0;"><h3 style="color:#FFFFFF; font-size:13px; tracking:0.25em; margin:0;">${statusHeader}</h3><div style="width:30px; height:1px; background:#FFFFFF; margin:15px auto;"></div></td></tr>
                    <tr><td style="font-size:10px; color:#A3A3A3; text-align:center; padding-bottom:30px; tracking:0.1em; line-height:2.0;">${statusMessage}</td></tr>
                    <tr><td style="padding:20px; background:#111111; border:1px solid #1A1A1A; margin-bottom:20px;"><span style="font-size:8px; color:#A3A3A3; display:block; margin-bottom:5px;">ORDER TRACKING STAMP</span><span style="font-size:10px; color:#FFFFFF; font-family:monospace;">#${orderId.toUpperCase()}</span></td></tr>
                    <tr><td><table width="100%" cellspacing="0" cellpadding="0" style="margin-top:20px; border-collapse:collapse;">${itemsHtml}</table></td></tr>
                    <tr><td style="padding-top:25px; font-size:11px; color:#FFFFFF; font-weight:bold;"><table width="100%"><tr><td>AGGREGATE TOTAL</td><td align="right" style="font-family:monospace;">₦${orderData.total_amount?.toLocaleString()}</td></tr></table></td></tr>
                    <tr><td align="center" style="padding-top:50px; border-top:1px solid #1A1A1A; margin-top:40px;"><p style="font-size:8px; color:#525252; margin:0; tracking:0.2em;">S. SIKAMÒRE COLLECTIVES © 2026</p></td></tr>
                  </table>
                </td></tr>
              </table>
            </body></html>
          `;
          
          await fetch('/api/send', { 
            method: 'POST', 
            headers: { 'Content-Type': 'application/json' }, 
            body: JSON.stringify({ 
              to: orderData.customer_email, 
              fromEmail: 'shipping@ssikamore.com',
              fromName: 'S. SIKAMÒRE LOGISTICS',
              subject: `S. SIKAMÒRE ORDER UPDATE: ${currentStatus.toUpperCase()}`, 
              html: clientHtmlTemplate 
            }) 
          });
        }

        if (currentStatus === 'shipped') {
          const vendorHtml = `
            <!DOCTYPE html><html><head><meta charset="utf-8"></head>
            <body style="margin:0; padding:0; background-color:#000000; font-family:-apple-system, sans-serif;">
              <table width="100%" border="0" cellspacing="0" cellpadding="0" style="background-color:#000000; padding:40px 10px;">
                <tr><td align="center">
                  <table width="500" border="0" cellspacing="0" cellpadding="0" style="background-color:#0A0A0A; border:1px solid #1A1A1A; padding:40px; text-transform:uppercase; letter-spacing:0.15em; line-height:1.8;">
                    <tr><td align="center" style="padding-bottom:20px; border-bottom:1px solid #1A1A1A;"><h2 style="font-family:serif; letter-spacing:0.35em; font-size:16px; margin:0; color:#FFFFFF;">ATELIER DISPATCH</h2></td></tr>
                    <tr><td style="font-size:11px; color:#FFFFFF; padding:35px 0 10px 0; font-weight:bold; tracking:0.2em; text-align:center;">PARCEL HANDED OVER TO COURIER PIPELINE</td></tr>
                    <tr><td style="font-size:9px; color:#A3A3A3; padding-bottom:20px; text-align:center;">ORDER REF: #${orderId.toUpperCase()}</td></tr>
                    <tr><td style="padding:20px; background:#111111; border:1px solid #1A1A1A; font-size:10px; color:#FFFFFF;"><span style="color:#525252; font-size:8px; display:block; margin-bottom:5px;">DELIVERY DESTINATION ITINERARY</span>${orderData.shipping_address || 'N/A'}</td></tr>
                    <tr><td><table width="100%" cellspacing="0" cellpadding="0" style="margin-top:30px; border-collapse:collapse;">${itemsHtml}</table></td></tr>
                  </table>
                </td></tr>
              </table>
            </body></html>
          `;
          
          await fetch('/api/send', { 
            method: 'POST', 
            headers: { 'Content-Type': 'application/json' }, 
            body: JSON.stringify({ 
              to: 'shipping@ssikamore.com', 
              fromEmail: 'shipping@ssikamore.com',
              fromName: 'S. SIKAMÒRE AUTOMATION',
              subject: `DISPATCH ALERT: ORDER #${orderId.slice(0,8).toUpperCase()} HAS SHIPPED`, 
              html: vendorHtml 
            }) 
          });
          
          showToast('CLIENT & TEAM AUTOMATICALLY NOTIFIED VIA EMAIL.');
        } else {
          showToast('CLIENT AUTOMATICALLY NOTIFIED VIA EMAIL.');
        }
      }
    } catch (err) { showToast(`FULFILLMENT ERROR: ${err.message.toUpperCase()}`); }
  };

  const confirmShipping = (order) => {
    if (!deliveryDays.trim()) return showToast("PLEASE ENTER TRANSIT DAYS.");
    handleUpdateOrderStatus(order.id, 'shipped', deliveryDays, order);
  };

  // ====================== NEWSLETTER DISPATCH CENTER ====================== //
  const handleSendBrandedNewsletter = async (e) => {
    e.preventDefault();
    if (!newsletterSubj.trim() || !newsletterMsg.trim()) return;
    
    if (subscribers.length === 0) {
      return showToast("DISPATCH DENIED: ACTIVE REGISTRY SIZE IS 0 PROFILES.");
    }

    setSendingNewsletter(true);

    try {
      const formattedLines = newsletterMsg.replace(/\n/g, '<br />');
      const gridProducts = liveProducts.slice(0, 2);
      let productGridHtml = '';
      
      if (gridProducts.length >= 2) {
        const img1 = getPrimaryImage(gridProducts.image);
        const img2 = getPrimaryImage(gridProducts.image);

        productGridHtml = `
          <tr>
            <td>
              <table width="100%" border="0" cellspacing="0" cellpadding="0" style="margin-top:40px; border-top:1px solid #1A1A1A; padding-top:40px;">
                <tr><td colspan="3" style="font-size:11px; color:#FFFFFF; tracking:0.25em; padding-bottom:20px; font-weight:bold;">OUR LATEST CURATIONS</td></tr>
                <tr>
                  <td width="48%" valign="top">
                    <table width="100%" border="0" cellspacing="0" cellpadding="0">
                      <tr><td bgcolor="#111111" style="border:1px solid #1A1A1A; padding:10px; text-align:center;"><img src="${img1}" width="100%" style="display:block;" /></td></tr>
                      <tr><td style="padding-top:12px; font-size:10px; color:#FFFFFF; font-weight:bold; tracking:0.15em;">${gridProducts.name.toUpperCase()}</td></tr>
                      <tr><td style="font-size:10px; color:#A3A3A3; font-family:monospace; padding-top:4px;">₦${gridProducts.price.toLocaleString()}</td></tr>
                      <tr><td style="padding-top:10px;"><a href="https://ssikamore.com/shop" style="font-size:8px; color:#FFFFFF; text-decoration:none; tracking:0.2em; font-weight:bold;">EXPLORE PIECE &rarr;</a></td></tr>
                    </table>
                  </td>
                  <td width="4%"></td>
                  <td width="48%" valign="top">
                    <table width="100%" border="0" cellspacing="0" cellpadding="0">
                      <tr><td bgcolor="#111111" style="border:1px solid #1A1A1A; padding:10px; text-align:center;"><img src="${img2}" width="100%" style="display:block;" /></td></tr>
                      <tr><td style="padding-top:12px; font-size:10px; color:#FFFFFF; font-weight:bold; tracking:0.15em;">${gridProducts.name.toUpperCase()}</td></tr>
                      <tr><td style="font-size:10px; color:#A3A3A3; font-family:monospace; padding-top:4px;">₦${gridProducts.price.toLocaleString()}</td></tr>
                      <tr><td style="padding-top:10px;"><a href="https://ssikamore.com/shop" style="font-size:8px; color:#FFFFFF; text-decoration:none; tracking:0.2em; font-weight:bold;">EXPLORE PIECE &rarr;</a></td></tr>
                    </table>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
        `;
      }

      const customHTMLTemplate = `
        <!DOCTYPE html><html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"></head>
        <body style="margin:0; padding:0; background-color:#000000; font-family:-apple-system, sans-serif;">
          <table width="100%" border="0" cellspacing="0" cellpadding="0" style="background-color:#000000; padding:60px 10px;">
            <tr><td align="center">
              <table width="520" border="0" cellspacing="0" cellpadding="0" style="background-color:#0A0A0A; color:#FFFFFF; padding:45px; border:1px solid #1A1A1A; text-transform:uppercase; letter-spacing:0.15em; line-height:1.8;">
                <tr><td align="right" style="padding-bottom:15px;"><a href="https://ssikamore.com/shop" style="color:#525252; text-decoration:none; font-size:7.5px; tracking:0.2em;">VIEW IN BROWSER</a></td></tr>
                <tr><td align="center" style="padding-bottom:30px; border-bottom:1px solid #1A1A1A;"><h1 style="font-family:serif; font-weight:normal; letter-spacing:0.45em; font-size:18px; margin:0; color:#FFFFFF;">S. SIKAMÒRE</h1></td></tr>
                <tr><td align="center" style="padding:45px 0 15px 0;"><h2 style="font-size:14px; tracking:0.3em; color:#FFFFFF; margin:0; font-weight:normal;">${newsletterSubj.toUpperCase()}</h2><div style="width:40px; height:1px; background:#FFFFFF; margin:20px auto;"></div></td></tr>
                <tr><td style="padding:20px 10px; font-size:10px; line-height:2.2; letter-spacing:0.12em; color:#A3A3A3; text-align:center;">${formattedLines}</td></tr>
                <tr>
                  <td align="center" style="padding-top:20px;">
                    <table width="100%" border="0" cellspacing="0" cellpadding="0" style="background-color:#111111; border:1px solid #1A1A1A; padding:30px 20px; text-align:center;">
                      <tr><td style="font-size:8px; color:#666; tracking:0.25em; padding-bottom:5px;">PRIVATE ATELIER DIRECTIVE</td></tr>
                      <tr><td style="font-size:13px; color:#FFFFFF; font-weight:bold; tracking:0.3em; padding-bottom:20px;">COMPLIMENTARY DROPS ACTIVE</td></tr>
                      <tr><td><a href="https://ssikamore.com/shop" style="background-color:#FFFFFF; color:#000000; text-decoration:none; padding:12px 35px; font-size:9px; font-weight:bold; tracking:0.25em; display:inline-block;">ENTER STOREFRONT</a></td></tr>
                    </table>
                  </td>
                </tr>
                ${productGridHtml}
                <tr><td align="center" style="padding-top:60px; border-top:1px solid #1A1A1A; margin-top:50px;"><p style="font-size:8px; color:#525252; margin:0; tracking:0.25em;">S. SIKAMÒRE COLLECTIVES © 2026<br/><br/><a href="#" style="color:#525252; text-decoration:underline;">UNSUBSCRIBE</a></p></td></tr>
              </table>
            </td></tr>
          </table>
        </body></html>
      `;

      const { error } = await supabase.from('campaigns').insert([{ subject: newsletterSubj.toUpperCase(), message: newsletterMsg, recipient_count: subscribers.length, html_payload: customHTMLTemplate }]);
      if (error) throw error;

      await Promise.all(
        subscribers.map(async (sub) => {
          if (!sub.email) return;
          return fetch('/api/send', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              to: sub.email,
              fromEmail: 'hello@ssikamore.com', 
              fromName: 'S. SIKAMÒRE',
              subject: newsletterSubj.toUpperCase(),
              html: customHTMLTemplate
            })
          }).catch(err => console.error(`Error pipeline connection for ${sub.email}:`, err));
        })
      );

      showToast(`DISPATCH SUCCESS! EDITORIAL DEPLOYED TO ${subscribers.length} INBOXES.`);
      setNewsletterSubj(''); setNewsletterMsg('');
    } catch (err) { showToast(`DISPATCH ERROR: ${err.message.toUpperCase()}`); } finally { setSendingNewsletter(false); }
  };

  const handleAdminTyping = (e) => {
    setReplyText(e.target.value);
    if (typingChannelRef.current) typingChannelRef.current.send({ type: 'broadcast', event: 'typing', payload: { sender: 'admin', isTyping: e.target.value.length > 0 } });
  };

  const handleAdminReply = async (e) => {
    e.preventDefault();
    if (!replyText.trim()) return;
    setSendingReply(true);

    try {
      const adminMessage = { sender: 'admin', text: replyText, timestamp: new Date().toISOString() };
      const currentHistory = activeChat.chat_history && Array.isArray(activeChat.chat_history) && activeChat.chat_history.length > 0 ? activeChat.chat_history : [{ sender: 'user', text: activeChat.message, timestamp: activeChat.created_at }];
      const updatedHistory = [...currentHistory, adminMessage];

      const { error } = await supabase.from('support_tickets').update({ chat_history: updatedHistory, status: 'replied', has_unread_user: true }).eq('id', activeChat.id);
      if (error) throw error;
      
      if (typingChannelRef.current) typingChannelRef.current.send({ type: 'broadcast', event: 'typing', payload: { sender: 'admin', isTyping: false } });
      setReplyText('');
    } catch (err) { showToast(`ERROR: ${err.message.toUpperCase()}`); } finally { setSendingReply(false); }
  };

  const totalVisits = analyticsData.filter(a => a.event_type === 'visit').length;
  const totalClicks = analyticsData.filter(a => a.event_type === 'click').length;
  const clickThroughRate = totalVisits > 0 ? ((totalClicks / totalVisits) * 100).toFixed(1) : 0;

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-zinc-50 text-black flex flex-col items-center justify-center px-6 font-sans antialiased">
        <div className="max-w-md w-full bg-white text-black p-10 shadow-lg border border-zinc-200 text-center">
          <h1 className="text-xl font-normal tracking-[0.4em] uppercase mb-2 font-serif">S. SIKAMÒRE</h1>
          <p className="text-[9px] tracking-[0.2em] uppercase text-zinc-500 mb-8">Admin Portal Access</p>
          <form onSubmit={handleLogin} className="flex flex-col gap-6">
            <input type="password" value={passcode} onChange={(e) => setPasscode(e.target.value)} placeholder="ENTER PASSCODE" required className="w-full bg-zinc-50 p-4 border border-zinc-200 focus:border-black outline-none text-base text-center tracking-widest text-black uppercase" />
            <button type="submit" className="w-full bg-black text-white py-4 text-[10px] tracking-[0.2em] uppercase hover:bg-zinc-800 font-medium transition-colors">Unlock Dashboard</button>
          </form>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-zinc-50 text-black py-12 px-4 sm:px-6 font-sans antialiased relative">
      <div className="max-w-5xl mx-auto">
        
        {/* TOP COMMAND NAVIGATION */}
        <div className="mb-10 text-center relative">
          <div className="absolute right-0 top-0">
            <button onClick={handleLogout} className="text-[8px] sm:text-[9px] tracking-widest text-zinc-500 hover:text-black uppercase transition-colors border border-zinc-200 hover:border-black px-3 py-1.5 font-medium bg-white">
              Sign Out
            </button>
          </div>
          <h1 className="text-2xl font-normal tracking-[0.4em] uppercase mb-2 font-serif text-black">S. SIKAMÒRE</h1>
          <div className="flex flex-wrap justify-center gap-2 sm:gap-4 mt-8">
            {['inventory', 'tracker', 'newsletter', 'support', 'vendors', 'analytics'].map((tab) => (
              <button key={tab} onClick={() => setActiveTab(tab)} className={`px-4 py-2 text-[9px] tracking-[0.2em] uppercase transition-colors border ${activeTab === tab ? 'bg-black text-white border-black' : 'bg-white text-zinc-500 border-zinc-200 hover:border-black hover:text-black'}`}>
                {tab}
              </button>
            ))}
          </div>
        </div>

        {/* --- TAB 1: INVENTORY MANAGEMENT --- */}
        {activeTab === 'inventory' && (
          <div className="animate-fade-in space-y-6">
            <div className="flex border-b border-zinc-200 pb-2">
              <button onClick={() => { setInventoryMode('manage'); setEditingProduct(null); }} className={`px-4 py-2 text-[10px] tracking-[0.2em] uppercase transition-colors ${inventoryMode === 'manage' ? 'text-black font-bold border-b-2 border-black' : 'text-zinc-400 hover:text-black'}`}>
                Manage Live
              </button>
              <button onClick={() => { setInventoryMode('deploy'); setEditingProduct(null); }} className={`px-4 py-2 text-[10px] tracking-[0.2em] uppercase transition-colors ${inventoryMode === 'deploy' ? 'text-black font-bold border-b-2 border-black' : 'text-zinc-400 hover:text-black'}`}>
                Deploy New
              </button>
            </div>

            {inventoryMode === 'manage' && (
              <div className="bg-white text-black p-6 sm:p-10 shadow-sm border border-zinc-200">
                {editingProduct ? (
                  <div>
                    <div className="flex justify-between items-center border-b border-zinc-200 pb-4 mb-8">
                      <h2 className="text-xs tracking-[0.3em] text-zinc-600 uppercase font-medium">Edit Product: {editingProduct.name}</h2>
                      <button onClick={() => setEditingProduct(null)} className="text-[9px] text-zinc-500 hover:text-black uppercase tracking-widest transition-colors">← Cancel Edit</button>
                    </div>
                    
                    <form onSubmit={submitEditProduct} className="flex flex-col gap-10">
                      <div className="relative border border-zinc-200 p-6 bg-zinc-50 rounded-sm">
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                          <div>
                            <label className="block text-[9px] tracking-[0.2em] text-zinc-500 mb-2 uppercase">Product Name</label>
                            <input type="text" value={editingProduct.name} onChange={(e)=>setEditingProduct({...editingProduct, name: e.target.value})} required className="w-full bg-white p-3 border border-zinc-200 focus:border-black outline-none text-xs text-black uppercase" />
                          </div>
                          <div>
                            <label className="block text-[9px] tracking-[0.2em] text-zinc-500 mb-2 uppercase">Price (₦)</label>
                            <input type="number" value={editingProduct.price} onChange={(e)=>setEditingProduct({...editingProduct, price: e.target.value})} required className="w-full bg-white p-3 border border-zinc-200 focus:border-black outline-none text-xs text-black" />
                          </div>
                          <div>
                            <label className="block text-[9px] tracking-[0.2em] text-zinc-500 mb-2 uppercase">Stock Qty</label>
                            <input type="number" value={editingProduct.stock_quantity} onChange={(e)=>setEditingProduct({...editingProduct, stock_quantity: e.target.value})} required className="w-full bg-white p-3 border border-zinc-200 focus:border-black outline-none text-xs text-black" />
                          </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6 pt-4 border-t border-zinc-200">
                          <div>
                            <label className="block text-[8px] tracking-[0.2em] text-zinc-500 mb-2 uppercase">Description</label>
                            <textarea value={editingProduct.description || ''} onChange={(e)=>setEditingProduct({...editingProduct, description: e.target.value})} rows="3" className="w-full bg-white p-3 border border-zinc-200 focus:border-black outline-none text-xs text-black uppercase resize-none placeholder-zinc-300" />
                          </div>
                          <div>
                            <label className="block text-[8px] tracking-[0.2em] text-zinc-500 mb-2 uppercase">Additional Info</label>
                            <textarea value={editingProduct.additional_information || ''} onChange={(e)=>setEditingProduct({...editingProduct, additional_information: e.target.value})} rows="3" className="w-full bg-white p-3 border border-zinc-200 focus:border-black outline-none text-xs text-black uppercase resize-none placeholder-zinc-300" />
                          </div>
                          <div>
                            <label className="block text-[8px] tracking-[0.2em] text-zinc-500 mb-2 uppercase">Store Policies</label>
                            <textarea value={editingProduct.store_policies || ''} onChange={(e)=>setEditingProduct({...editingProduct, store_policies: e.target.value})} rows="3" className="w-full bg-white p-3 border border-zinc-200 focus:border-black outline-none text-xs text-black uppercase resize-none placeholder-zinc-300" />
                          </div>
                          <div>
                            <label className="block text-[8px] tracking-[0.2em] text-zinc-500 mb-2 uppercase">Inquiries</label>
                            <textarea value={editingProduct.inquiries || ''} onChange={(e)=>setEditingProduct({...editingProduct, inquiries: e.target.value})} rows="3" className="w-full bg-white p-3 border border-zinc-200 focus:border-black outline-none text-xs text-black uppercase resize-none placeholder-zinc-300" />
                          </div>
                        </div>

                        <div className="flex items-center gap-6">
                          <div className="flex gap-2">
                            {/* ROBUST EDIT IMAGE PREVIEWS */}
                            {editPreviews.length > 0 
                              ? editPreviews.map((p, i) => <img key={i} src={p} className="w-12 h-16 object-cover border border-zinc-200 bg-white" alt="Preview"/>) 
                              : extractCleanUrls(editingProduct.image).map((p, i) => <img key={i} src={p} className="w-12 h-16 object-cover border border-zinc-200 bg-white" alt="Current"/>)
                            }
                          </div>
                          <div className="flex-1">
                            <label className="block text-[8px] tracking-[0.2em] text-zinc-500 mb-2 uppercase">Replace Images (Up to 5)</label>
                            <input type="file" accept="image/*" multiple onChange={handleEditImageChange} className="w-full text-xs file:mr-4 file:py-2 file:px-4 file:border file:border-zinc-200 file:text-[8px] file:tracking-widest file:bg-zinc-100 file:text-black file:uppercase file:cursor-pointer text-zinc-600 hover:file:bg-zinc-200 transition-colors" />
                          </div>
                        </div>
                      </div>

                      <button type="submit" disabled={isUpdating} className="w-full bg-black text-white py-5 text-[10px] tracking-[0.3em] uppercase font-medium hover:bg-zinc-800 transition-colors disabled:opacity-50 mt-4 rounded-sm">
                        {isUpdating ? 'SAVING CHANGES...' : 'COMMIT EDITS'}
                      </button>
                    </form>
                  </div>
                ) : (
                  <div>
                    <div className="flex justify-between items-center border-b border-zinc-200 pb-4 mb-8">
                      <h2 className="text-xs tracking-[0.3em] text-zinc-600 uppercase font-medium">Live Collection ({liveProducts.length})</h2>
                    </div>
                    {liveProducts.length === 0 ? (
                      <p className="text-[10px] text-zinc-500 uppercase tracking-widest text-center py-10">No live products found in the database.</p>
                    ) : (
                      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                        {liveProducts.map(product => (
                          <div key={product.id} className="border border-zinc-200 bg-zinc-50 p-4 flex flex-col justify-between">
                            <div className="flex gap-4 mb-4">
                              <div className="w-16 h-20 shrink-0 bg-white border border-zinc-200 overflow-hidden">
                                {/* FIXED LIVE COLLECTION THUMBNAILS */}
                                <img src={getPrimaryImage(product.image)} alt={product.name} className="w-full h-full object-cover" />
                              </div>
                              <div>
                                <h3 className="text-[10px] uppercase tracking-wider text-black font-medium line-clamp-2">{product.name}</h3>
                                <p className="text-[9px] text-zinc-500 font-mono mt-1">₦{product.price.toLocaleString()}</p>
                                <p className="text-[8px] text-zinc-400 uppercase tracking-widest mt-1">Stock: {product.stock_quantity}</p>
                              </div>
                            </div>
                            <div className="flex gap-2 border-t border-zinc-200 pt-3">
                              <button onClick={() => startEditingProduct(product)} className="flex-1 border border-zinc-200 bg-white hover:bg-zinc-100 text-black py-2 text-[8px] uppercase tracking-widest transition-colors">Edit</button>
                              <button onClick={() => handleDeleteProduct(product.id)} className="flex-1 border border-red-200 bg-white hover:bg-red-50 text-red-600 py-2 text-[8px] uppercase tracking-widest transition-colors">Delete</button>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}

            {inventoryMode === 'deploy' && (
              <div className="bg-white text-black p-6 sm:p-10 shadow-sm border border-zinc-200">
                <div className="flex justify-between items-center border-b border-zinc-200 pb-4 mb-8">
                  <h2 className="text-xs tracking-[0.3em] text-zinc-600 uppercase font-medium">Product Deployment</h2>
                  <button onClick={addProductRow} className="text-[9px] bg-zinc-100 hover:bg-zinc-200 text-black px-4 py-2 uppercase tracking-widest transition-colors">+ Add Row</button>
                </div>
                
                <form onSubmit={handleBulkSubmit} className="flex flex-col gap-10">
                  {productsList.map((product, index) => (
                    <div key={product.id} className="relative border border-zinc-200 p-6 bg-zinc-50 rounded-sm">
                      {productsList.length > 1 && (
                        <button type="button" onClick={() => removeProductRow(product.id)} className="absolute top-4 right-4 text-zinc-400 hover:text-red-500 text-xs">✕</button>
                      )}
                      <p className="text-[9px] tracking-[0.2em] text-zinc-500 mb-4 uppercase font-medium">Item 0{index + 1}</p>
                      
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                        <div>
                          <label className="block text-[9px] tracking-[0.2em] text-zinc-500 mb-2 uppercase">Product Name</label>
                          <input type="text" value={product.name} onChange={(e)=>updateProductData(product.id, 'name', e.target.value)} required className="w-full bg-white p-3 border border-zinc-200 focus:border-black outline-none text-xs text-black uppercase" placeholder="E.G. 18K AURA PENDANT" />
                        </div>
                        <div>
                          <label className="block text-[9px] tracking-[0.2em] text-zinc-500 mb-2 uppercase">Price (₦)</label>
                          <input type="number" value={product.price} onChange={(e)=>updateProductData(product.id, 'price', e.target.value)} required className="w-full bg-white p-3 border border-zinc-200 focus:border-black outline-none text-xs text-black" placeholder="E.G. 85000" />
                        </div>
                        <div>
                          <label className="block text-[9px] tracking-[0.2em] text-zinc-500 mb-2 uppercase">Stock Qty</label>
                          <input type="number" value={product.stock} onChange={(e)=>updateProductData(product.id, 'stock', e.target.value)} required className="w-full bg-white p-3 border border-zinc-200 focus:border-black outline-none text-xs text-black" placeholder="E.G. 15" />
                        </div>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6 pt-4 border-t border-zinc-200">
                        <div>
                          <label className="block text-[8px] tracking-[0.2em] text-zinc-500 mb-2 uppercase">Description (Optional)</label>
                          <textarea value={product.description} onChange={(e)=>updateProductData(product.id, 'description', e.target.value)} rows="3" className="w-full bg-white p-3 border border-zinc-200 focus:border-black outline-none text-xs text-black uppercase resize-none placeholder-zinc-300" placeholder="E.G. HAND-CRAFTED LEATHER TOTE..." />
                        </div>
                        <div>
                          <label className="block text-[8px] tracking-[0.2em] text-zinc-500 mb-2 uppercase">Additional Info (Optional)</label>
                          <textarea value={product.additional_information} onChange={(e)=>updateProductData(product.id, 'additional_information', e.target.value)} rows="3" className="w-full bg-white p-3 border border-zinc-200 focus:border-black outline-none text-xs text-black uppercase resize-none placeholder-zinc-300" placeholder="E.G. COMPOSITION: 100% CALFSKIN..." />
                        </div>
                        <div>
                          <label className="block text-[8px] tracking-[0.2em] text-zinc-500 mb-2 uppercase">Store Policies (Optional)</label>
                          <textarea value={product.store_policies} onChange={(e)=>updateProductData(product.id, 'store_policies', e.target.value)} rows="3" className="w-full bg-white p-3 border border-zinc-200 focus:border-black outline-none text-xs text-black uppercase resize-none placeholder-zinc-300" placeholder="E.G. COMPLIMENTARY DROPS REQUIRE 3-5 DAYS..." />
                        </div>
                        <div>
                          <label className="block text-[8px] tracking-[0.2em] text-zinc-500 mb-2 uppercase">Inquiries (Optional)</label>
                          <textarea value={product.inquiries} onChange={(e)=>updateProductData(product.id, 'inquiries', e.target.value)} rows="3" className="w-full bg-white p-3 border border-zinc-200 focus:border-black outline-none text-xs text-black uppercase resize-none placeholder-zinc-300" placeholder="E.G. CONTACT OUR CLIENT CONCIERGE..." />
                        </div>
                      </div>

                      <div className="flex items-center gap-6">
                        <div className="flex gap-2">
                          {product.previews.length > 0 ? (
                            product.previews.map((p, i) => <img key={i} src={p} className="w-12 h-16 object-cover border border-zinc-200 bg-white" alt="Preview"/>)
                          ) : (
                            <span className="text-[7px] text-zinc-400 uppercase tracking-widest flex items-center justify-center w-12 h-16 border border-zinc-200 bg-white">Img</span>
                          )}
                        </div>
                        <div className="flex-1">
                          <label className="block text-[8px] tracking-[0.2em] text-zinc-500 mb-2 uppercase">Upload Images (Up to 5)</label>
                          <input type="file" accept="image/*" multiple onChange={(e)=>handleImageChange(product.id, e)} required className="w-full text-xs file:mr-4 file:py-2 file:px-4 file:border file:border-zinc-200 file:text-[8px] file:tracking-widest file:bg-zinc-100 file:text-black file:uppercase file:cursor-pointer text-zinc-600 hover:file:bg-zinc-200 transition-colors" />
                        </div>
                      </div>
                    </div>
                  ))}

                  <button type="submit" disabled={disabled} className="w-full bg-black text-white py-5 text-[10px] tracking-[0.3em] uppercase font-medium hover:bg-zinc-800 transition-colors disabled:opacity-50 mt-4 rounded-sm">
                    {disabled ? 'DEPLOYING TO STORE...' : `PUBLISH ${productsList.length} ITEM(S)`}
                  </button>
                </form>
              </div>
            )}
          </div>
        )}

        {/* --- TAB 2: REAL-TIME ORDER FULFILLMENT TRACKER --- */}
        {activeTab === 'tracker' && (
          <div className="space-y-6 animate-fade-in">
            {orders.length === 0 ? (
              <div className="bg-white text-zinc-500 p-12 text-center border border-zinc-200 uppercase tracking-widest text-[10px] rounded-sm">No sales items logged in database.</div>
            ) : (
              orders.map((order) => (
                <div key={order.id} className="bg-white text-black border border-zinc-200 shadow-sm overflow-hidden p-6 sm:p-8 flex flex-col gap-6 rounded-sm">
                  <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-zinc-200 pb-4">
                    <div>
                      <p className="text-[8px] tracking-widest text-zinc-500 uppercase font-mono">ORDER ID: #{order.id.slice(0,8).toUpperCase()}</p>
                      <h3 className="text-xs font-medium text-black uppercase tracking-wider mt-1">{order.customer_name} • <span className="text-zinc-500 font-normal normal-case">{order.customer_email}</span></h3>
                    </div>
                    
                    {interceptedOrder === order.id ? (
                      <div className="flex flex-col sm:flex-row gap-2 mt-4 sm:mt-0 w-full sm:w-auto">
                        <input type="text" placeholder="e.g. 3-5 Business Days" value={deliveryDays} onChange={e => setDeliveryDays(e.target.value)} className="bg-white border border-zinc-300 text-black p-2.5 outline-none text-xs uppercase tracking-widest w-full sm:w-48 placeholder-zinc-400 focus:border-black" />
                        <button onClick={() => confirmShipping(order)} className="bg-black text-white px-4 py-2.5 text-[9px] tracking-widest uppercase font-medium hover:bg-zinc-800 transition-colors">Confirm</button>
                        <button onClick={() => setInterceptedOrder(null)} className="text-zinc-400 hover:text-red-500 px-2 py-2 text-xs transition-colors">✕</button>
                      </div>
                    ) : (
                      <select value={order.status} onChange={(e) => {
                        if (e.target.value === 'shipped') setInterceptedOrder(order.id);
                        else handleUpdateOrderStatus(order.id, e.target.value, null, order);
                      }} className="bg-white text-black border border-zinc-300 text-base md:text-xs tracking-widest uppercase p-2.5 outline-none mt-4 sm:mt-0 w-full sm:w-auto focus:border-black">
                        <option value="pending">Pending</option>
                        <option value="shipped">Shipped</option>
                        <option value="delivered">Delivered</option>
                      </select>
                    )}
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-[10px] tracking-wider uppercase text-zinc-600">
                    <div>
                      <span className="text-[8px] block text-zinc-400 mb-1 font-medium">Destination Address</span>
                      <p className="text-black leading-relaxed">{order.shipping_address || 'N/A'}</p>
                      <p className="text-zinc-500 mt-1 font-mono">{order.customer_phone || 'N/A'}</p>
                    </div>
                    <div>
                      <span className="text-[8px] block text-zinc-400 mb-1 font-medium">Items Summary</span>
                      <div className="space-y-2 mt-2">
                        {order.items?.map((item, idx) => (
                          <div key={idx} className="flex justify-between text-zinc-700">
                            <span>{item.name} (SIZE: {item.size}) <strong className="text-black">x{item.quantity}</strong></span>
                            <span className="font-mono text-zinc-500">₦{(item.price * item.quantity).toLocaleString()}</span>
                          </div>
                        ))}
                      </div>
                      <div className="border-t border-zinc-200 mt-4 pt-3 flex justify-between text-black font-medium text-xs">
                        <span>Aggregate Total</span>
                        <span>₦{order.total_amount?.toLocaleString()}</span>
                      </div>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        )}

        {/* --- TAB 3: THE ARCHIVE EDITORIAL CAMPAIGN DISPATCHER --- */}
        {activeTab === 'newsletter' && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 animate-fade-in">
            <div className="lg:col-span-2 bg-white text-black p-6 sm:p-8 border border-zinc-200 shadow-sm flex flex-col justify-between rounded-sm">
              <div>
                <h3 className="text-xs uppercase tracking-widest font-medium border-b border-zinc-200 pb-3 mb-6">Create Registry Broadcast</h3>
                <form onSubmit={handleSendBrandedNewsletter} className="space-y-6">
                  <div>
                    <label className="block text-[8px] tracking-[0.2em] text-zinc-500 mb-2 uppercase">Dispatch Subject</label>
                    <input type="text" value={newsletterSubj} onChange={(e) => setNewsletterSubj(e.target.value)} required placeholder="E.G. THE ARCHIVE: FINE JEWELRY & LEATHER" className="w-full bg-zinc-50 p-4 border border-zinc-200 focus:border-black outline-none text-xs text-black uppercase tracking-wider transition-colors placeholder-zinc-400"/>
                  </div>
                  <div>
                    <label className="block text-[8px] tracking-[0.2em] text-zinc-500 mb-2 uppercase">Custom Editorial Content</label>
                    <textarea value={newsletterMsg} onChange={(e) => setNewsletterMsg(e.target.value)} required rows="8" placeholder="Type your dynamic announcement here..." className="w-full bg-zinc-50 p-4 border border-zinc-200 focus:border-black outline-none text-xs text-black tracking-wider resize-none transition-colors placeholder-zinc-400" />
                  </div>
                  <button type="submit" disabled={sendingNewsletter} className="w-full bg-black text-white py-4 text-[9px] tracking-[0.3em] uppercase hover:bg-zinc-800 font-medium disabled:opacity-40 transition-colors rounded-sm">
                    {sendingNewsletter ? 'BROADCASTING PAYLOAD...' : `SEND PRIVATE DISPATCH TO ${subscribers.length} PROFILES`}
                  </button>
                </form>
              </div>
            </div>

            <div className="flex flex-col gap-6">
              <div className="bg-white border border-zinc-200 p-6 shadow-sm rounded-sm text-center">
                <span className="text-[8px] text-zinc-500 block tracking-widest uppercase mb-2">Active Registry Size</span>
                <h2 className="text-3xl font-light tracking-wide text-black font-serif">{subscribers.length.toLocaleString()} <span className="text-[10px] tracking-widest uppercase font-sans text-zinc-400 ml-1">Profiles</span></h2>
              </div>
              <div className="bg-zinc-50 text-black border border-zinc-200 p-6 flex-1 overflow-y-auto max-h-[360px] rounded-sm shadow-sm">
                <h4 className="text-[9px] tracking-widest uppercase text-zinc-500 border-b border-zinc-200 pb-2 mb-4 font-medium">Broadcast Dispatch Log</h4>
                {campaigns.length === 0 ? (
                  <p className="text-[8px] text-zinc-400 uppercase tracking-widest text-center py-6">No historical dispatches found.</p>
                ) : (
                  <div className="space-y-4">
                    {campaigns.map((camp) => (
                      <div key={camp.id} className="border-b border-zinc-200 pb-3 last:border-0">
                        <h5 className="text-[10px] text-black uppercase tracking-wider truncate font-medium">{camp.subject}</h5>
                        <p className="text-[8px] text-zinc-500 uppercase tracking-widest mt-1">{new Date(camp.created_at).toLocaleDateString()} • {camp.recipient_count} Recipients</p>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* --- TAB 4: LIVE CUSTOMER CONCIERGE CHAT SUPPORT --- */}
        {activeTab === 'support' && (
          <div className="bg-white text-black p-0 flex flex-col md:flex-row h-[600px] border border-zinc-200 shadow-sm animate-fade-in relative overflow-hidden rounded-sm">
            
            <div className={`w-full md:w-1/3 border-r border-zinc-200 bg-zinc-50 overflow-y-auto ${activeChat ? 'hidden md:block' : 'block'} h-full`}>
              <div className="p-6 border-b border-zinc-200 sticky top-0 bg-zinc-50 z-10">
                <h2 className="text-xs tracking-[0.3em] text-black uppercase font-medium">Support Inbox</h2>
              </div>
              <div className="flex flex-col">
                {tickets.length === 0 ? (
                  <p className="text-[9px] text-zinc-500 uppercase tracking-widest text-center py-10">No messages found.</p>
                ) : (
                  tickets.map((ticket) => (
                    <button key={ticket.id} onClick={() => setActiveChat(ticket)} className={`p-5 text-left border-b border-zinc-200 hover:bg-zinc-100 transition-colors flex flex-col gap-1 ${activeChat?.id === ticket.id ? 'bg-white border-l-2 border-l-black' : ''}`}>
                      <div className="flex justify-between items-center mb-1">
                        <span className="text-xs font-medium uppercase tracking-wider text-black">{ticket.name}</span>
                        {ticket.status === 'unread' && <span className="w-1.5 h-1.5 bg-black rounded-full animate-pulse"></span>}
                      </div>
                      <p className="text-[10px] text-zinc-500 truncate tracking-wide">{ticket.subject}</p>
                      <p className="text-[8px] text-zinc-400 mt-1 uppercase tracking-widest font-medium">{ticket.status}</p>
                    </button>
                  ))
                )}
              </div>
            </div>

            <div className={`w-full md:w-2/3 flex-col bg-white ${!activeChat ? 'hidden md:flex' : 'flex'} h-full`}>
              {activeChat ? (
                <>
                  <div className="p-6 border-b border-zinc-200 bg-white flex justify-between items-center shrink-0">
                    <div>
                      <h3 className="text-xs uppercase tracking-widest text-black font-medium">{activeChat.name}</h3>
                      <p className="text-[9px] text-zinc-500 tracking-[0.1em] mt-1">{activeChat.email} | {activeChat.subject}</p>
                    </div>
                    <button onClick={() => setActiveChat(null)} className="md:hidden text-[9px] tracking-widest uppercase border border-zinc-300 px-3 py-1.5 hover:bg-zinc-50 text-black transition-colors rounded-sm">
                      &larr; Back
                    </button>
                  </div>

                  <div className="flex-1 p-6 overflow-y-auto space-y-4 bg-zinc-50">
                    {(activeChat.chat_history?.length > 0 ? activeChat.chat_history : [{ sender: 'user', text: activeChat.message, timestamp: activeChat.created_at }]).map((msg, idx) => (
                      <div key={idx} className={`flex flex-col ${msg.sender === 'admin' ? 'items-end' : 'items-start'}`}>
                        <span className="text-[8px] tracking-[0.2em] text-zinc-400 uppercase mb-1">{msg.sender === 'admin' ? 'You' : activeChat.name}</span>
                        <div className={`max-w-[85%] p-4 text-[11px] leading-relaxed tracking-wider border rounded-sm ${msg.sender === 'admin' ? 'bg-black border-black text-white' : 'bg-white border-zinc-200 text-black font-medium'}`}>{msg.text}</div>
                      </div>
                    ))}
                    
                    {isUserTyping && (
                      <div className="flex flex-col items-start animate-fade-in">
                        <span className="text-[8px] tracking-[0.2em] text-zinc-400 uppercase mb-1">{activeChat.name} IS TYPING...</span>
                      </div>
                    )}
                    <div ref={chatEndRef} />
                  </div>
                  
                  <form onSubmit={handleAdminReply} className="p-6 border-t border-zinc-200 bg-white flex gap-4 shrink-0">
                    <input type="text" value={replyText} onChange={handleAdminTyping} placeholder="Type a response to dispatch..." className="flex-1 bg-zinc-50 p-4 border border-zinc-200 focus:border-black outline-none text-xs text-black tracking-wide placeholder-zinc-400 rounded-sm transition-colors" />
                    <button type="submit" disabled={sendingReply || !replyText.trim()} className="bg-black text-white px-6 text-[9px] tracking-widest uppercase font-medium hover:bg-zinc-800 transition-colors disabled:opacity-30 rounded-sm">{sendingReply ? 'SENDING...' : 'DISPATCH'}</button>
                  </form>
                </>
              ) : (
                <div className="flex-1 flex items-center justify-center p-6 bg-zinc-50">
                  <p className="text-[10px] tracking-[0.2em] text-zinc-400 uppercase text-center">Select an active ticket from the archive log</p>
                </div>
              )}
            </div>
          </div>
        )}

        {/* --- TAB 5: VENDOR LEDGER --- */}
        {activeTab === 'vendors' && (
          <div className="bg-white text-black border border-zinc-200 shadow-sm flex flex-col md:flex-row h-[600px] animate-fade-in rounded-sm overflow-hidden">
            <div className="w-full md:w-1/3 border-r border-zinc-200 bg-zinc-50 overflow-y-auto h-full">
              <div className="p-6 border-b border-zinc-200 sticky top-0 bg-zinc-50 z-10">
                <h3 className="text-xs uppercase tracking-widest text-black font-medium">Vendor Profiles</h3>
              </div>
              <div className="flex flex-col">
                {vendors.length === 0 ? (
                  <p className="text-[9px] text-zinc-500 text-center uppercase py-8 tracking-widest">No registered vendors found.</p>
                ) : (
                  vendors.map(v => (
                    <button key={v.id} onClick={() => setActiveVendor(v)} className={`p-5 text-left border-b border-zinc-200 hover:bg-zinc-100 transition-colors flex flex-col gap-1 ${activeVendor?.id === v.id ? 'bg-white border-l-2 border-l-black' : ''}`}>
                      <span className="text-xs font-medium uppercase tracking-wider text-black">{v.name}</span>
                      <span className="text-[9px] text-zinc-500 font-serif tracking-widest uppercase">{v.company || 'Independent Vendor'}</span>
                    </button>
                  ))
                )}
              </div>
            </div>

            <div className="w-full md:w-2/3 flex flex-col bg-white overflow-y-auto p-6 sm:p-10 h-full">
              {activeVendor ? (
                <div className="space-y-8">
                  <div className="border-b border-zinc-200 pb-6">
                    <span className="text-[8px] tracking-[0.2em] text-zinc-400 uppercase block mb-1 font-medium">Vendor Contact Directory</span>
                    <h2 className="text-lg font-normal uppercase text-black font-serif tracking-wide">{activeVendor.name}</h2>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 mt-3 text-[10px] tracking-wider uppercase text-zinc-600">
                      <p><span className="text-zinc-400 font-mono">EMAIL:</span> {activeVendor.email}</p>
                      <p><span className="text-zinc-400 font-mono">PHONE:</span> {activeVendor.phone || 'N/A'}</p>
                    </div>
                  </div>
                  <div>
                    <h4 className="text-[9px] uppercase tracking-widest text-black mb-4 font-medium">Historical Orders Fulfilled</h4>
                    {vendorOrders.length === 0 ? (
                      <p className="text-[9px] text-zinc-500 uppercase tracking-widest py-4">This vendor profile has no registered purchasing streams.</p>
                    ) : (
                      <div className="space-y-4">
                        {vendorOrders.map(vo => (
                          <div key={vo.id} className="bg-zinc-50 border border-zinc-200 p-4 rounded-sm">
                            <div className="flex justify-between text-[8px] font-mono text-zinc-500 uppercase border-b border-zinc-200 pb-2 mb-3">
                              <span>ORDER STAMP: #{vo.id.slice(0,8).toUpperCase()}</span>
                              <span>{new Date(vo.created_at).toLocaleDateString()}</span>
                            </div>
                            
                            <div className="mb-4 text-[9px] text-zinc-600 uppercase tracking-wider bg-white p-3 border border-zinc-200">
                              <span className="block text-zinc-400 text-[8px] mb-1 font-medium">Shipping Destination:</span>
                              <span className="text-black">{vo.shipping_address || 'N/A'}</span> <br/>
                              <span className="text-zinc-500 font-mono mt-1 block">Phone: {vo.customer_phone || 'N/A'}</span>
                            </div>

                            <div className="space-y-1 text-[10px] tracking-wide text-zinc-700 uppercase">
                              {vo.items?.map((item, i) => (
                                <div key={i} className="flex justify-between">
                                  <span>{item.name} (SIZE: {item.size}) <strong className="text-black">x{item.quantity}</strong></span>
                                  <span className="font-mono text-zinc-500">₦{(item.price * item.quantity).toLocaleString()}</span>
                                </div>
                              ))}
                            </div>
                            <div className="border-t border-zinc-200 mt-3 pt-2 flex justify-between text-[11px] text-black font-medium uppercase tracking-wider">
                              <span>Total Value</span>
                              <span>₦{vo.total_amount?.toLocaleString()}</span>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              ) : (
                <div className="h-full flex items-center justify-center text-center bg-zinc-50">
                  <p className="text-[10px] tracking-[0.2em] text-zinc-400 uppercase">Select a vendor to audit profile analytics and order logs</p>
                </div>
              )}
            </div>
          </div>
        )}

        {/* --- TAB 6: REAL-TIME ANALYTICS --- */}
        {activeTab === 'analytics' && (
          <div className="space-y-6 animate-fade-in">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="bg-white border border-zinc-200 p-6 shadow-sm rounded-sm text-center">
                <span className="text-[8px] text-zinc-500 block tracking-widest uppercase mb-1 font-medium">Total Page Visits</span>
                <h2 className="text-3xl font-light tracking-wide text-black font-serif animate-pulse">{totalVisits.toLocaleString()} <span className="text-[9px] tracking-widest text-zinc-400 uppercase font-sans">Logs</span></h2>
              </div>
              <div className="bg-black text-white border border-black p-6 shadow-sm rounded-sm text-center">
                <span className="text-[8px] text-zinc-400 block tracking-widest uppercase mb-1 font-medium">Interactive Product Clicks</span>
                <h2 className="text-3xl font-light tracking-wide text-white font-serif">{totalClicks.toLocaleString()} <span className="text-[9px] tracking-widest text-zinc-500 uppercase font-sans">Interactions</span></h2>
              </div>
              <div className="bg-white border border-zinc-200 p-6 shadow-sm rounded-sm text-center">
                <span className="text-[8px] text-zinc-500 block tracking-widest uppercase mb-1 font-medium">Click-Through Engagement</span>
                <h2 className="text-3xl font-light tracking-wide text-black font-serif">{clickThroughRate}% <span className="text-[9px] tracking-widest text-zinc-400 uppercase font-sans">Rate</span></h2>
              </div>
            </div>
            
            <div className="bg-white text-black border border-zinc-200 p-6 sm:p-8 shadow-sm rounded-sm">
              <div className="border-b border-zinc-200 pb-3 mb-4 flex justify-between items-center">
                <h4 className="text-[10px] tracking-widest uppercase text-black font-medium">Real-Time Interaction Feed Matrix</h4>
                <span className="text-[7.5px] bg-green-100 text-green-700 border border-green-200 px-2 py-0.5 rounded-full uppercase tracking-widest font-bold animate-pulse">Live</span>
              </div>
              {analyticsData.length === 0 ? (
                <p className="text-[9px] text-zinc-400 uppercase tracking-widest text-center py-8">Awaiting real-time pipeline event transfers...</p>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-[10px] tracking-wider uppercase divide-y divide-zinc-200 text-zinc-600">
                    <thead>
                      <tr className="text-black text-[8px] tracking-widest border-b border-zinc-200 pb-2">
                        <th className="py-2.5 font-medium">Timestamp</th>
                        <th className="py-2.5 font-medium">Action Event</th>
                        <th className="py-2.5 font-medium">Target Canvas Log</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-zinc-100">
                      {analyticsData.slice(0, 20).map((metric) => (
                        <tr key={metric.id} className="hover:bg-zinc-50 transition-colors">
                          <td className="py-3 font-mono text-[8.5px] text-zinc-400">{new Date(metric.created_at).toLocaleTimeString()}</td>
                          <td className="py-3">
                            <span className={`px-2 py-0.5 rounded-sm text-[8px] font-medium tracking-widest ${metric.event_type === 'visit' ? 'bg-zinc-100 text-zinc-600' : 'bg-black text-white'}`}>
                              {metric.event_type}
                            </span>
                          </td>
                          <td className="py-3 text-black truncate max-w-[240px]">
                            {metric.event_type === 'click' ? `Clicked Product: ${metric.product_name || 'Item Tile'}` : `Viewed Path: ${metric.page_path}`}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
        )}

      </div>
    </div>
  );
}
