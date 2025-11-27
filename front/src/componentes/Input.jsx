export const Input = ({ type = 'text', name, placeholder, id, title, value, onChange, className = '', ...rest }) => {
  return (
    <div className="flex flex-col gap-2">
      <label htmlFor={id}
        className='font-bold text-sm'
      >{title}</label>
      <input
        className={`shadow border-1px border-slate-300 rounded p-1 ${className}`}
        id={id}
        type={type}
        name={name}
        placeholder={placeholder}
        value={value}
        onChange={onChange}
        {...rest}
      />
    </div>)
}