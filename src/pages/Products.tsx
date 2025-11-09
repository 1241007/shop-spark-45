import { useEffect, useState } from "react"
import { supabase } from "../lib/supabaseClient"

type Product = {
  id: string
  name: string
  price: number
  image: string
  description?: string
}

export default function Index() {
  const [products, setProducts] = useState<Product[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchProducts = async () => {
      const { data, error } = await supabase
        .from("products")
        .select("*")

      if (error) {
        console.error("Error fetching products:", error.message)
      } else {
        setProducts(data || [])
      }
      setLoading(false)
    }

    fetchProducts()
  }, [])

  if (loading) return <p>Loading products...</p>

  return (
    <div className="grid grid-cols-3 gap-4 p-4">
      {products.map((product) => (
        <div key={product.id} className="border p-4 rounded-lg shadow">
          <img
            src={product.image}
            alt={product.name}
            className="w-full h-40 object-cover rounded"
          />
          <h2 className="text-lg font-bold mt-2">{product.name}</h2>
          <p className="text-gray-700">₹{(product as any).original_price || product.price}</p>
        </div>
      ))}
    </div>
  )
}
