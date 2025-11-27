export const Button = ({
  type = 'submit',
  value,
  onClick = undefined,
  disabled = false
}) => {
  return (
    <button
      className='w-full py-3 px-6 rounded-xl font-semibold text-white bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 shadow-lg hover:shadow-xl hover:shadow-purple-500/50 transform hover:scale-[1.02] active:scale-[0.98] transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:ring-offset-2 focus:ring-offset-slate-900 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none'
      type={type} 
      onClick={onClick}
      disabled={disabled}
    >
      {value}
    </button>
  )
}

