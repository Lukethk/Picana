CREATE OR REPLACE VIEW view_sales_history_detailed AS 
 SELECT 
     s.id AS sale_id, 
     s.invoice_number, 
     s.created_at, 
     s.total, 
     s.payment_method, 
     si.quantity, 
     p.name AS product_name, 
     (SELECT string_agg(t.name, ', ') 
      FROM sale_item_toppings sit 
      JOIN toppings t ON sit.topping_id = t.id 
      WHERE sit.sale_item_id = si.id) AS toppings_seleccionados, 
     (SELECT string_agg(f.name, ', ') 
      FROM sale_item_flavors sif 
      JOIN flavors f ON sif.flavor_id = f.id 
      WHERE sif.sale_item_id = si.id) AS sabores_seleccionados 
 FROM sales s 
 JOIN sale_items si ON s.id = si.sale_id 
 JOIN products p ON si.product_id = p.id;