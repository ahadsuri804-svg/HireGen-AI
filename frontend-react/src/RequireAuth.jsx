import React from 'react'
import { Navigate } from 'react-router-dom'
import { useAuth } from "./AuthProvider";
export default function RequireAuth({ children }){
  const { user, loading } = useAuth()
  if(loading) return <div className='p-6'>Loading...</div>
  if(!user) return <Navigate to='/' replace />
  return children
}
